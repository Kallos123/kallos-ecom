import { Request, Response } from 'express';
import { ordersService } from './orders.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { param } from '../../utils/param';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  note: z.string().optional(),
});

const trackingSchema = z.object({
  trackingId: z.string().min(1),
  courierPartner: z.string().min(1),
});

// Customer
export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.placeOrder(req.user!.id, req.body);
  sendCreated(res, order, 'Order placed successfully');
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { orders, total } = await ordersService.getOrders(req.user!.id, req.query as any, skip, limit);
  sendSuccess(res, orders, 'Success', 200, buildPaginationMeta(total, page, limit));
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.getOrderById(req.user!.id, param(req, 'id'));
  sendSuccess(res, order);
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  await ordersService.cancelOrder(req.user!.id, param(req, 'id'));
  sendSuccess(res, null, 'Order cancelled');
});

// Admin
export const adminListOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { orders, total } = await ordersService.adminListOrders(req.query as any, skip, limit);
  sendSuccess(res, orders, 'Success', 200, buildPaginationMeta(total, page, limit));
});

export const adminGetOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.adminGetOrder(param(req, 'id'));
  sendSuccess(res, order);
});

export const adminUpdateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = updateStatusSchema.parse(req.body);
  await ordersService.adminUpdateStatus(param(req, 'id'), status as any, note);
  sendSuccess(res, null, 'Order status updated');
});

export const adminUpdateTracking = asyncHandler(async (req: Request, res: Response) => {
  const { trackingId, courierPartner } = trackingSchema.parse(req.body);
  const order = await ordersService.adminUpdateTracking(param(req, 'id'), trackingId, courierPartner);
  sendSuccess(res, order, 'Tracking updated');
});
