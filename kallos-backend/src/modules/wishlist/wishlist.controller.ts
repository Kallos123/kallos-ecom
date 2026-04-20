import { Request, Response } from 'express';
import { wishlistService } from './wishlist.service';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { param } from '../../utils/param';

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await wishlistService.getWishlist(req.user!.id);
  sendSuccess(res, wishlist);
});

export const toggle = asyncHandler(async (req: Request, res: Response) => {
  const result = await wishlistService.toggle(req.user!.id, param(req, 'productId'));
  sendSuccess(res, result, result.added ? 'Added to wishlist' : 'Removed from wishlist');
});

export const adminListWishlists = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const search = (req.query['search'] as string) || undefined;
  const { wishlists, total } = await wishlistService.adminListWishlists(skip, limit, search);
  sendSuccess(res, wishlists, 'Success', 200, buildPaginationMeta(total, page, limit));
});
