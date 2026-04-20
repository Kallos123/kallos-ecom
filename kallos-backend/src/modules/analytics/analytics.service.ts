import { prisma } from '../../config/database';

function dateRange(range: string): { gte: Date; lte: Date } {
  const now = new Date();
  const lte = new Date(now);
  let gte = new Date(now);

  switch (range) {
    case 'today':
      gte.setHours(0, 0, 0, 0);
      break;
    case 'week':
      gte.setDate(gte.getDate() - 7);
      break;
    case 'month':
      gte.setDate(1);
      gte.setHours(0, 0, 0, 0);
      break;
    case 'year':
      gte.setMonth(0, 1);
      gte.setHours(0, 0, 0, 0);
      break;
    default:
      gte.setDate(gte.getDate() - 30);
  }

  return { gte, lte };
}

export const analyticsService = {
  async getSalesOverview(range: string) {
    const { gte, lte } = dateRange(range);
    const where = { createdAt: { gte, lte }, paymentStatus: 'PAID' as const };

    const [orders, revenue, prevOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({ where, _sum: { totalAmount: true }, _avg: { totalAmount: true } }),
      prisma.order.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(gte.getTime() - (lte.getTime() - gte.getTime())),
            lte: gte,
          },
        },
      }),
    ]);

    return {
      totalOrders: orders,
      totalRevenue: Number(revenue._sum.totalAmount ?? 0),
      averageOrderValue: Number(revenue._avg.totalAmount ?? 0),
      vsLastPeriod: prevOrders > 0 ? ((orders - prevOrders) / prevOrders) * 100 : null,
    };
  },

  async getRevenueTrend(days: number) {
    const points = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));

      const result = await prisma.order.aggregate({
        where: { createdAt: { gte: start, lte: end }, paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
        _count: true,
      });

      points.push({
        date: start.toISOString().slice(0, 10),
        revenue: Number(result._sum.totalAmount ?? 0),
        orders: result._count,
      });
    }
    return points;
  },

  async getTopProducts(limit: number) {
    const items = await prisma.orderItem.groupBy({
      by: ['variantId'],
      where: { order: { paymentStatus: 'PAID' } },
      _sum: { quantity: true, totalPrice: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const withDetails = await Promise.all(
      items.map(async (item) => {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, select: { url: true }, take: 1 } } } },
        });
        return {
          variantId: item.variantId,
          product: variant?.product,
          totalQuantitySold: item._sum.quantity ?? 0,
          totalRevenue: Number(item._sum.totalPrice ?? 0),
        };
      })
    );

    return withDetails;
  },

  async getLowStockProducts(threshold: number) {
    return prisma.productVariant.findMany({
      where: { stock: { lte: threshold, gt: 0 }, isActive: true },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { stock: 'asc' },
    });
  },

  async getOrderStatusBreakdown() {
    const groups = await prisma.order.groupBy({
      by: ['orderStatus'],
      _count: true,
    });
    return groups.map((g) => ({ status: g.orderStatus, count: g._count }));
  },

  async getPaymentMethodBreakdown() {
    const groups = await prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: true,
      _sum: { totalAmount: true },
    });
    return groups.map((g) => ({
      method: g.paymentMethod,
      count: g._count,
      revenue: Number(g._sum.totalAmount ?? 0),
    }));
  },

  async getCustomerStats() {
    const [total, newThisMonth, topCustomers] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
      }),
      prisma.order.groupBy({
        by: ['userId'],
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
    ]);

    const topWithDetails = await Promise.all(
      topCustomers.map(async (c) => {
        const user = await prisma.user.findUnique({
          where: { id: c.userId },
          select: { firstName: true, lastName: true, email: true },
        });
        return {
          user,
          totalSpent: Number(c._sum.totalAmount ?? 0),
          orderCount: c._count,
        };
      })
    );

    return { total, newThisMonth, topCustomers: topWithDetails };
  },

  async getSummary() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalRevenue,
      totalOrders,
      totalUsers,
      pendingOrders,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthOrders,
      lastMonthOrders,
    ] = await Promise.all([
      prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.order.count({ where: { paymentStatus: 'PAID' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count({ where: { orderStatus: 'CONFIRMED' } }),
      prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: thisMonthStart } }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { totalAmount: true } }),
      prisma.order.count({ where: { paymentStatus: 'PAID', createdAt: { gte: thisMonthStart } } }),
      prisma.order.count({ where: { paymentStatus: 'PAID', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    ]);

    const thisRev = Number(thisMonthRevenue._sum.totalAmount ?? 0);
    const lastRev = Number(lastMonthRevenue._sum.totalAmount ?? 0);
    const revenueGrowth = lastRev > 0 ? Math.round(((thisRev - lastRev) / lastRev) * 100) : null;
    const ordersGrowth = lastMonthOrders > 0 ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100) : null;

    return {
      totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
      totalOrders,
      totalUsers,
      pendingOrders,
      revenueGrowth,
      ordersGrowth,
    };
  },

  async getReturnStats() {
    const [total, approved, rejected] = await Promise.all([
      prisma.returnRequest.count(),
      prisma.returnRequest.count({ where: { status: 'APPROVED' } }),
      prisma.returnRequest.count({ where: { status: 'REJECTED' } }),
    ]);
    const totalOrders = await prisma.order.count({ where: { paymentStatus: 'PAID' } });
    return {
      totalReturns: total,
      approved,
      rejected,
      returnRate: totalOrders > 0 ? (total / totalOrders) * 100 : 0,
    };
  },
};
