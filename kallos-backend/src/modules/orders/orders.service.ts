import { Prisma, OrderStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import { couponsService } from '../coupons/coupons.service';
import { emailService } from '../notifications/email.service';
import { notificationsService } from '../notifications/notifications.service';
import type { PlaceOrderInput, OrderQuery } from './orders.schema';

const SHIPPING_CHARGE = 99;
const FREE_SHIPPING_ABOVE = 999;

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `KAL-${date}-${rand}`;
}

export const ordersService = {
  async placeOrder(userId: string, input: PlaceOrderInput) {
    // 1. Validate address
    const address = await prisma.address.findFirst({ where: { id: input.addressId, userId } });
    if (!address) throw AppError.notFound('Address not found');

    // 2. Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: { include: { product: { select: { id: true, name: true, basePrice: true, isActive: true, images: { where: { isPrimary: true }, select: { url: true }, take: 1 } } } },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) throw AppError.badRequest('Cart is empty');

    // 3. Validate stock + compute subtotal
    for (const item of cart.items) {
      if (!item.variant.isActive || !item.variant.product.isActive) {
        throw AppError.badRequest(`Product "${item.variant.product.name}" is no longer available`);
      }
      if (item.variant.stock < item.quantity) {
        throw AppError.badRequest(`Insufficient stock for "${item.variant.product.name}"`);
      }
    }

    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.variant.price ?? item.variant.product.basePrice) * item.quantity;
    }, 0);

    // 4. Coupon
    let discountAmount = 0;
    let couponId: string | undefined;
    let isFreeShipping = false;

    if (input.couponCode) {
      const orderCount = await prisma.order.count({ where: { userId } });
      const result = await couponsService.validate(
        { code: input.couponCode },
        userId,
        subtotal,
        orderCount === 0
      );
      discountAmount = result.discountAmount;
      isFreeShipping = result.isFreeShipping;
      couponId = result.coupon.id;
    }

    // 5. Shipping charge
    const shippingCharge =
      isFreeShipping || subtotal - discountAmount >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_CHARGE;

    // 6. Wallet
    let walletAmountUsed = 0;
    if (input.walletAmountToUse > 0) {
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      const available = Math.min(input.walletAmountToUse, Number(wallet?.balance ?? 0));
      walletAmountUsed = Math.min(available, subtotal - discountAmount + shippingCharge);
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + shippingCharge - walletAmountUsed);

    // 7. Build address snapshot
    const addressSnapshot = {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    };

    // 8. Determine initial order status
    const requiresOnlinePayment =
      input.paymentMethod === 'RAZORPAY' || input.paymentMethod === 'RAZORPAY_AND_WALLET';
    const initialStatus: OrderStatus = requiresOnlinePayment ? 'PENDING_PAYMENT' : 'CONFIRMED';

    // 9. Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Deduct wallet
      if (walletAmountUsed > 0) {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        const newBalance = Number(wallet!.balance) - walletAmountUsed;
        await tx.wallet.update({ where: { userId }, data: { balance: newBalance } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet!.id,
            type: 'DEBIT',
            reason: 'ORDER_PAYMENT',
            amount: walletAmountUsed,
            balanceAfter: newBalance,
          },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          addressId: input.addressId,
          addressSnapshot,
          subtotal,
          shippingCharge,
          discount: discountAmount,
          walletAmountUsed,
          totalAmount,
          couponId: couponId ?? null,
          couponCode: input.couponCode ?? null,
          paymentMethod: input.paymentMethod,
          paymentStatus: requiresOnlinePayment ? 'PENDING' : 'PAID',
          orderStatus: initialStatus,
          notes: input.notes,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              productSnapshot: {
                name: item.variant.product.name,
                image: item.variant.product.images[0]?.url ?? null,
                size: item.variant.size,
                color: item.variant.color,
              },
              quantity: item.quantity,
              unitPrice: Number(item.variant.price ?? item.variant.product.basePrice),
              totalPrice: Number(item.variant.price ?? item.variant.product.basePrice) * item.quantity,
            })),
          },
          statusHistory: { create: { status: initialStatus, note: 'Order placed' } },
        },
        include: { items: true },
      });

      // Record coupon usage
      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usageCount: { increment: 1 } } });
        await tx.couponUsage.create({ data: { couponId, userId, orderId: newOrder.id } });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    // 10. Send confirmation email (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
    if (user && initialStatus === 'CONFIRMED') {
      emailService.sendOrderConfirmation(user.email, user.firstName, order.orderNumber, totalAmount.toFixed(2)).catch(() => {});
    }

    // 11. Admin notification (non-blocking)
    notificationsService.create({
      type: 'NEW_ORDER',
      title: 'New Order',
      message: `Order #${order.orderNumber} · ₹${totalAmount.toFixed(0)}`,
      link: `/admin/orders/${order.id}`,
    }).catch(() => {});

    return order;
  },

  async getOrders(userId: string, query: OrderQuery, skip: number, limit: number) {
    const where: Prisma.OrderWhereInput = { userId };
    if (query.status) where['orderStatus'] = query.status as OrderStatus;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: { productSnapshot: true, quantity: true, unitPrice: true, totalPrice: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);
    return { orders, total };
  },

  async getOrderById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        returnRequest: true,
      },
    });
    if (!order) throw AppError.notFound('Order not found');
    return order;
  },

  async cancelOrder(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw AppError.notFound('Order not found');

    const cancellable: OrderStatus[] = ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING'];
    if (!cancellable.includes(order.orderStatus)) {
      throw AppError.badRequest('Order cannot be cancelled at this stage');
    }

    await prisma.$transaction(async (tx) => {
      // Restore stock
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // Restore wallet if used
      if (Number(order.walletAmountUsed) > 0) {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        const newBalance = Number(wallet!.balance) + Number(order.walletAmountUsed);
        await tx.wallet.update({ where: { userId }, data: { balance: newBalance } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet!.id,
            type: 'CREDIT',
            reason: 'REFUND',
            amount: Number(order.walletAmountUsed),
            balanceAfter: newBalance,
            referenceId: order.id,
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { orderStatus: 'CANCELLED', paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status: 'CANCELLED', note: 'Cancelled by customer' },
      });
    });
  },

  // ─── Admin ────────────────────────────────────────────────────────────────

  async adminListOrders(query: OrderQuery, skip: number, limit: number) {
    const where: Prisma.OrderWhereInput = {};
    const validStatuses = Object.values(OrderStatus);
    if (query.status && validStatuses.includes(query.status as OrderStatus)) {
      where['orderStatus'] = query.status as OrderStatus;
    }
    if (query.userId) where['userId'] = query.userId;
    if ((query as any).search) {
      const s = (query as any).search as string;
      where['OR'] = [
        { orderNumber: { contains: s, mode: 'insensitive' } },
        { user: { email: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: { select: { productSnapshot: true, quantity: true, totalPrice: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const normalized = orders.map((o) => ({
      ...o,
      status: o.orderStatus,
      total: Number(o.totalAmount),
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discount),
      shippingCharge: Number(o.shippingCharge),
      courier: o.courierPartner,
    }));

    return { orders: normalized, total };
  },

  async adminGetOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        returnRequest: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });
    if (!order) throw AppError.notFound('Order not found');

    const snap = order.addressSnapshot as any;

    return {
      ...order,
      status: order.orderStatus,
      total: Number(order.totalAmount),
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discount),
      shippingCharge: Number(order.shippingCharge),
      courier: order.courierPartner,
      shippingAddress: snap ? {
        fullName:  snap.fullName  ?? null,
        phone:     snap.phone     ?? null,
        line1:     snap.addressLine1 ?? null,
        line2:     snap.addressLine2 ?? null,
        city:      snap.city      ?? null,
        state:     snap.state     ?? null,
        pincode:   snap.pincode   ?? null,
      } : null,
      items: order.items.map((item) => {
        const ps = item.productSnapshot as any;
        return {
          ...item,
          productName:  ps?.name  ?? '—',
          variantSku:   ps?.sku   ?? item.variantId,
          variantSize:  ps?.size  ?? null,
          variantColor: ps?.color ?? null,
          unitPrice:    Number(item.unitPrice),
          totalPrice:   Number(item.totalPrice),
        };
      }),
    };
  },

  async adminUpdateStatus(orderId: string, status: OrderStatus, note?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw AppError.notFound('Order not found');

    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { orderStatus: status } }),
      prisma.orderStatusHistory.create({ data: { orderId, status, note } }),
    ]);

    // Send shipped email
    if (status === 'SHIPPED') {
      const updated = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: { select: { email: true, firstName: true } } },
      });
      if (updated?.trackingId && updated.courierPartner) {
        emailService.sendOrderShipped(updated.user.email, updated.user.firstName, updated.orderNumber, updated.trackingId, updated.courierPartner).catch(() => {});
      }
    }
  },

  async adminUpdateTracking(orderId: string, trackingId: string, courierPartner: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw AppError.notFound('Order not found');
    return prisma.order.update({ where: { id: orderId }, data: { trackingId, courierPartner } });
  },
};
