import { Request, Response } from 'express';
import { cartService } from './cart.service';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { param } from '../../utils/param';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.user!.id);
  sendSuccess(res, cart);
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const { variantId, quantity } = req.body;
  const cart = await cartService.addItem(req.user!.id, variantId, quantity);
  sendSuccess(res, cart, 'Item added to cart');
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateItem(req.user!.id, param(req, 'itemId'), req.body.quantity);
  sendSuccess(res, cart, 'Cart updated');
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.removeItem(req.user!.id, param(req, 'itemId'));
  sendSuccess(res, cart, 'Item removed');
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  await cartService.clearCart(req.user!.id);
  sendSuccess(res, null, 'Cart cleared');
});

export const adminListCarts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const search = (req.query['search'] as string) || undefined;
  const { carts, total } = await cartService.adminListCarts(skip, limit, search);
  sendSuccess(res, carts, 'Success', 200, buildPaginationMeta(total, page, limit));
});
