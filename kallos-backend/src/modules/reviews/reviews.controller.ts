import { Request, Response } from 'express';
import { reviewsService } from './reviews.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { param } from '../../utils/param';
import { z } from 'zod';

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().max(2000).optional(),
  orderId: z.string().uuid().optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(100).optional(),
  body: z.string().max(2000).optional(),
});

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const sort = (req.query['sort'] as string) ?? 'newest';
  const result = await reviewsService.getProductReviews(param(req, 'productId'), skip, limit, sort);
  sendSuccess(res, result, 'Success', 200, buildPaginationMeta(result.total, page, limit));
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const data = createReviewSchema.parse(req.body);
  const review = await reviewsService.createReview(req.user!.id, param(req, 'productId'), data);
  sendCreated(res, review, 'Review submitted and pending approval');
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const data = updateReviewSchema.parse(req.body);
  const review = await reviewsService.updateReview(req.user!.id, param(req, 'id'), data);
  sendSuccess(res, review, 'Review updated');
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  await reviewsService.deleteReview(req.user!.id, param(req, 'id'));
  sendSuccess(res, null, 'Review deleted');
});

export const adminListReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const search = req.query['search'] as string | undefined;
  const { reviews, total } = await reviewsService.listReviews(req.query['status'] as string, search, skip, limit);
  sendSuccess(res, reviews, 'Success', 200, buildPaginationMeta(total, page, limit));
});

export const moderateReview = asyncHandler(async (req: Request, res: Response) => {
  const { status } = z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).parse(req.body);
  const review = await reviewsService.moderateReview(param(req, 'id'), status);
  sendSuccess(res, review, `Review ${status.toLowerCase()}`);
});

export const adminDeleteReview = asyncHandler(async (req: Request, res: Response) => {
  await reviewsService.adminDeleteReview(param(req, 'id'));
  sendSuccess(res, null, 'Review deleted');
});
