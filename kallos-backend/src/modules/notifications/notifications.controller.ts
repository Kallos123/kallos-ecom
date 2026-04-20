import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { notificationsService } from './notifications.service';
import { param } from '../../utils/param';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const result = await notificationsService.list();
  sendSuccess(res, result);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markRead(param(req, 'id'));
  sendSuccess(res, null, 'Marked as read');
});

export const markAllRead = asyncHandler(async (_req: Request, res: Response) => {
  await notificationsService.markAllRead();
  sendSuccess(res, null, 'All marked as read');
});

export const deleteOne = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.deleteOne(param(req, 'id'));
  sendSuccess(res, null, 'Notification deleted');
});
