import { Request, Response } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await settingsService.getAll();
  sendSuccess(res, settings);
});

export const updateBatch = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as Record<string, string>;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw AppError.badRequest('Body must be an object of key-value pairs');
  }
  // Coerce all values to strings
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(updates)) {
    cleaned[k] = String(v);
  }
  const settings = await settingsService.updateBatch(cleaned);
  sendSuccess(res, settings, 'Settings saved');
});

export const updateOne = asyncHandler(async (req: Request, res: Response) => {
  const key   = req.params['key'] as string;
  const value = String(req.body.value ?? '');
  if (!key) throw AppError.badRequest('key param required');
  const settings = await settingsService.update(key, value);
  sendSuccess(res, settings, 'Setting updated');
});
