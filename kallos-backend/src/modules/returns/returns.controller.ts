import { Request, Response } from 'express';
import { returnsService, requestReturnSchema } from './returns.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { param } from '../../utils/param';
import { z } from 'zod';

export const requestReturn = asyncHandler(async (req: Request, res: Response) => {
  const input = requestReturnSchema.parse(req.body);
  const result = await returnsService.requestReturn(req.user!.id, param(req, 'orderId'), input);
  sendCreated(res, result, 'Return request submitted');
});

export const listMyReturns = asyncHandler(async (req: Request, res: Response) => {
  const result = await returnsService.listMyReturns(req.user!.id);
  sendSuccess(res, result);
});

export const getMyReturn = asyncHandler(async (req: Request, res: Response) => {
  const result = await returnsService.getMyReturn(req.user!.id, param(req, 'orderId'));
  sendSuccess(res, result);
});

export const adminListReturns = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { requests, total } = await returnsService.listReturnRequests(req.query['status'] as string, skip, limit);
  sendSuccess(res, requests, 'Success', 200, buildPaginationMeta(total, page, limit));
});

export const processReturn = asyncHandler(async (req: Request, res: Response) => {
  const { approved, adminNote } = z.object({ approved: z.boolean(), adminNote: z.string().optional() }).parse(req.body);
  const result = await returnsService.processReturn(param(req, 'id'), approved, adminNote);
  sendSuccess(res, result, approved ? 'Return approved' : 'Return rejected');
});
