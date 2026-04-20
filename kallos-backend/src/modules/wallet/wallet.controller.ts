import { Request, Response } from 'express';
import { walletService } from './wallet.service';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { z } from 'zod';

export const getWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await walletService.getWallet(req.user!.id);
  sendSuccess(res, wallet);
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const { transactions, total } = await walletService.getTransactions(req.user!.id, skip, limit);
  sendSuccess(res, transactions, 'Success', 200, buildPaginationMeta(total, page, limit));
});

export const adminAdjust = asyncHandler(async (req: Request, res: Response) => {
  const { userId, amount, reason } = z.object({
    userId: z.string().uuid(),
    amount: z.number(),
    reason: z.string().min(1),
  }).parse(req.body);
  const result = await walletService.adminAdjust(userId, amount, reason);
  sendSuccess(res, result, 'Wallet adjusted');
});
