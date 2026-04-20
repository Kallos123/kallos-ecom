import { Request, Response } from 'express';
import { usersService } from './users.service';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { param } from '../../utils/param';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getProfile(req.user!.id);
  sendSuccess(res, user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateProfile(req.user!.id, req.body);
  sendSuccess(res, user, 'Profile updated');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await usersService.changePassword(req.user!.id, req.body);
  sendSuccess(res, null, 'Password changed. Please log in again.');
});

// ─── Addresses ───────────────────────────────────────────────────────────────

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await usersService.getAddresses(req.user!.id);
  sendSuccess(res, addresses);
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await usersService.addAddress(req.user!.id, req.body);
  sendSuccess(res, address, 'Address added', 201);
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await usersService.updateAddress(req.user!.id, param(req, 'id'), req.body);
  sendSuccess(res, address, 'Address updated');
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  await usersService.deleteAddress(req.user!.id, param(req, 'id'));
  sendSuccess(res, null, 'Address deleted');
});

export const setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
  await usersService.setDefaultAddress(req.user!.id, param(req, 'id'));
  sendSuccess(res, null, 'Default address updated');
});

// ─── Admin ───────────────────────────────────────────────────────────────────

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const search = req.query['search'] as string | undefined;
  const { users, total } = await usersService.listUsers(page, limit, skip, search);
  sendSuccess(res, users, 'Success', 200, buildPaginationMeta(total, page, limit));
});

export const adminGetUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.adminGetUser(param(req, 'id'));
  sendSuccess(res, user);
});

export const adminUpdateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.adminUpdateUser(param(req, 'id'), req.body);
  sendSuccess(res, user, 'User updated');
});

export const setUserActive = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body;
  const result = await usersService.setUserActive(param(req, 'id'), Boolean(isActive));
  sendSuccess(res, result, `User ${result.isActive ? 'activated' : 'deactivated'}`);
});
