import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import type {
  CreateCouponInput,
  UpdateCouponInput,
  ApplyCouponInput,
  CreateFlashSaleInput,
  UpdateFlashSaleInput,
} from './coupons.schema';

export const couponsService = {
  // ─── Admin ────────────────────────────────────────────────────────────────

  async listCoupons(skip: number, limit: number) {
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.coupon.count(),
    ]);
    return { coupons, total };
  },

  async createCoupon(input: CreateCouponInput) {
    const existing = await prisma.coupon.findUnique({ where: { code: input.code } });
    if (existing) throw AppError.conflict('Coupon code already exists');

    return prisma.coupon.create({ data: input });
  },

  async updateCoupon(id: string, input: UpdateCouponInput) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw AppError.notFound('Coupon not found');
    return prisma.coupon.update({ where: { id }, data: input });
  },

  async deleteCoupon(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw AppError.notFound('Coupon not found');
    await prisma.coupon.delete({ where: { id } });
  },

  async getCouponUsages(couponId: string, skip: number, limit: number) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw AppError.notFound('Coupon not found');

    const [usages, total] = await Promise.all([
      prisma.couponUsage.findMany({
        where: { couponId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.couponUsage.count({ where: { couponId } }),
    ]);

    return { coupon, usages, total };
  },

  // ─── Customer ─────────────────────────────────────────────────────────────

  async validate(input: ApplyCouponInput, userId: string, cartSubtotal: number, isFirstOrder: boolean) {
    const now = new Date();
    const coupon = await prisma.coupon.findUnique({ where: { code: input.code } });

    if (!coupon || !coupon.isActive) throw AppError.badRequest('Invalid or expired coupon code');
    if (coupon.startsAt && coupon.startsAt > now) throw AppError.badRequest('Coupon is not yet active');
    if (coupon.expiresAt && coupon.expiresAt < now) throw AppError.badRequest('Coupon has expired');
    if (coupon.totalUsageLimit !== null && coupon.usageCount >= coupon.totalUsageLimit) {
      throw AppError.badRequest('Coupon usage limit reached');
    }
    if (coupon.minOrderValue !== null && cartSubtotal < Number(coupon.minOrderValue)) {
      throw AppError.badRequest(`Minimum order value ₹${coupon.minOrderValue} required`);
    }
    if (coupon.isFirstTimeOnly && !isFirstOrder) {
      throw AppError.badRequest('This coupon is for first-time orders only');
    }

    const userUsages = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsages >= coupon.perUserLimit) {
      throw AppError.badRequest('You have already used this coupon');
    }

    const discountAmount = calculateDiscount(coupon.type, Number(coupon.value), cartSubtotal, coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined);
    const isFreeShipping = coupon.type === 'FREE_SHIPPING';

    return { coupon, discountAmount, isFreeShipping };
  },

  // ─── Flash Sales ──────────────────────────────────────────────────────────

  async listFlashSales() {
    return prisma.flashSale.findMany({
      orderBy: { startTime: 'desc' },
      include: { items: { include: { product: { select: { id: true, name: true, slug: true } } } } },
    });
  },

  async getActiveFlashSales() {
    const now = new Date();
    return prisma.flashSale.findMany({
      where: { isActive: true, startTime: { lte: now }, endTime: { gte: now } },
      include: { items: { include: { product: { select: { id: true, name: true, slug: true, basePrice: true } } } } },
    });
  },

  async createFlashSale(input: CreateFlashSaleInput) {
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    if (end <= start) throw AppError.badRequest('End time must be after start time');

    return prisma.flashSale.create({
      data: {
        name: input.name,
        startTime: start,
        endTime: end,
        isActive: input.isActive,
        items: { create: input.items },
      },
      include: { items: true },
    });
  },

  async deleteFlashSale(id: string) {
    const sale = await prisma.flashSale.findUnique({ where: { id } });
    if (!sale) throw AppError.notFound('Flash sale not found');
    await prisma.flashSale.delete({ where: { id } });
  },

  async updateFlashSale(id: string, input: UpdateFlashSaleInput) {
    const sale = await prisma.flashSale.findUnique({ where: { id } });
    if (!sale) throw AppError.notFound('Flash sale not found');
    return prisma.flashSale.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.startTime !== undefined && { startTime: new Date(input.startTime) }),
        ...(input.endTime !== undefined && { endTime: new Date(input.endTime) }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
  },

  async getFlashSale(id: string) {
    const sale = await prisma.flashSale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, basePrice: true } },
          },
        },
      },
    });
    if (!sale) throw AppError.notFound('Flash sale not found');
    return sale;
  },

  async addFlashSaleItem(saleId: string, productId: string, discountType: string, discountValue: number) {
    const sale = await prisma.flashSale.findUnique({ where: { id: saleId } });
    if (!sale) throw AppError.notFound('Flash sale not found');

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw AppError.notFound('Product not found');

    const existing = await prisma.flashSaleItem.findUnique({
      where: { flashSaleId_productId: { flashSaleId: saleId, productId } },
    });
    if (existing) throw AppError.conflict('Product already in this flash sale');

    return prisma.flashSaleItem.create({
      data: { flashSaleId: saleId, productId, discountType: discountType as any, discountValue },
      include: { product: { select: { id: true, name: true, slug: true, basePrice: true } } },
    });
  },

  async removeFlashSaleItem(saleId: string, itemId: string) {
    const item = await prisma.flashSaleItem.findFirst({
      where: { id: itemId, flashSaleId: saleId },
    });
    if (!item) throw AppError.notFound('Item not found');
    await prisma.flashSaleItem.delete({ where: { id: itemId } });
  },

  async getFlashSalePrice(productId: string): Promise<{ salePrice: number; discountType: string; discountValue: number } | null> {
    const now = new Date();
    const saleItem = await prisma.flashSaleItem.findFirst({
      where: {
        productId,
        flashSale: { isActive: true, startTime: { lte: now }, endTime: { gte: now } },
      },
      include: { product: { select: { basePrice: true } } },
    });

    if (!saleItem) return null;

    const base = Number(saleItem.product.basePrice);
    const salePrice = calculateDiscount(saleItem.discountType, Number(saleItem.discountValue), base);

    return {
      salePrice: Math.max(0, base - salePrice),
      discountType: saleItem.discountType,
      discountValue: Number(saleItem.discountValue),
    };
  },
};

function calculateDiscount(
  type: string,
  value: number,
  cartTotal: number,
  maxDiscount?: number
): number {
  let discount = 0;
  if (type === 'PERCENTAGE') {
    discount = (cartTotal * value) / 100;
    if (maxDiscount) discount = Math.min(discount, maxDiscount);
  } else if (type === 'FLAT') {
    discount = Math.min(value, cartTotal);
  } else if (type === 'FREE_SHIPPING') {
    discount = 0; // Shipping waiver handled separately
  }
  return Math.round(discount * 100) / 100;
}
