import { Request, Response } from 'express';
import { z } from 'zod';
import { couponsService } from './coupons.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { param } from '../../utils/param';
import { prisma } from '../../config/database';

const validateCouponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  cartSubtotal: z.number().positive(),
});

export const listCoupons = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { coupons, total } = await couponsService.listCoupons(skip, limit);
  sendSuccess(res, coupons, 'Success', 200, buildPaginationMeta(total, page, limit));
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponsService.createCoupon(req.body);
  sendCreated(res, coupon);
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponsService.updateCoupon(param(req, 'id'), req.body);
  sendSuccess(res, coupon, 'Coupon updated');
});

export const getCouponUsages = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { coupon, usages, total } = await couponsService.getCouponUsages(param(req, 'id'), skip, limit);
  sendSuccess(res, { coupon, usages }, 'Success', 200, buildPaginationMeta(total, page, limit));
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await couponsService.deleteCoupon(param(req, 'id'));
  sendSuccess(res, null, 'Coupon deleted');
});

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, cartSubtotal } = validateCouponSchema.parse(req.body);
  const userId = req.user!.id;
  const orderCount = await prisma.order.count({ where: { userId } });
  const result = await couponsService.validate({ code }, userId, cartSubtotal, orderCount === 0);
  sendSuccess(res, {
    discountAmount: result.discountAmount,
    isFreeShipping: result.isFreeShipping,
    couponType: result.coupon.type,
  }, 'Coupon is valid');
});

export const getActiveFlashSales = asyncHandler(async (_req: Request, res: Response) => {
  const sales = await couponsService.getActiveFlashSales();
  sendSuccess(res, sales);
});

export const listFlashSales = asyncHandler(async (_req: Request, res: Response) => {
  const sales = await couponsService.listFlashSales();
  sendSuccess(res, sales);
});

export const createFlashSale = asyncHandler(async (req: Request, res: Response) => {
  const sale = await couponsService.createFlashSale(req.body);
  sendCreated(res, sale);
});

export const deleteFlashSale = asyncHandler(async (req: Request, res: Response) => {
  await couponsService.deleteFlashSale(param(req, 'id'));
  sendSuccess(res, null, 'Flash sale deleted');
});

export const updateFlashSale = asyncHandler(async (req: Request, res: Response) => {
  const sale = await couponsService.updateFlashSale(param(req, 'id'), req.body);
  sendSuccess(res, sale, 'Flash sale updated');
});

export const getFlashSale = asyncHandler(async (req: Request, res: Response) => {
  const sale = await couponsService.getFlashSale(param(req, 'id'));
  sendSuccess(res, sale);
});

const addItemSchema = z.object({
  productId: z.string().uuid(),
  discountType: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.number().positive(),
});

export const addFlashSaleItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId, discountType, discountValue } = addItemSchema.parse(req.body);
  const item = await couponsService.addFlashSaleItem(param(req, 'id'), productId, discountType, discountValue);
  sendCreated(res, item);
});

export const removeFlashSaleItem = asyncHandler(async (req: Request, res: Response) => {
  await couponsService.removeFlashSaleItem(param(req, 'id'), param(req, 'itemId'));
  sendSuccess(res, null, 'Item removed');
});
