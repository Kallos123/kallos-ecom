import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { env } from '../../config/env';

export const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getSummary();
  sendSuccess(res, data);
});

export const getSalesOverview = asyncHandler(async (req: Request, res: Response) => {
  const range = (req.query['range'] as string) ?? 'month';
  const data = await analyticsService.getSalesOverview(range);
  sendSuccess(res, data);
});

export const getRevenueTrend = asyncHandler(async (req: Request, res: Response) => {
  const days = Math.min(90, parseInt(req.query['days'] as string) || 30);
  const data = await analyticsService.getRevenueTrend(days);
  sendSuccess(res, data);
});

export const getTopProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(50, parseInt(req.query['limit'] as string) || 10);
  const data = await analyticsService.getTopProducts(limit);
  sendSuccess(res, data);
});

export const getLowStock = asyncHandler(async (req: Request, res: Response) => {
  const threshold = parseInt(req.query['threshold'] as string) || env.LOW_STOCK_THRESHOLD;
  const data = await analyticsService.getLowStockProducts(threshold);
  sendSuccess(res, data);
});

export const getOrderStatusBreakdown = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getOrderStatusBreakdown();
  sendSuccess(res, data);
});

export const getPaymentBreakdown = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getPaymentMethodBreakdown();
  sendSuccess(res, data);
});

export const getCustomerStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getCustomerStats();
  sendSuccess(res, data);
});

export const getReturnStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getReturnStats();
  sendSuccess(res, data);
});
