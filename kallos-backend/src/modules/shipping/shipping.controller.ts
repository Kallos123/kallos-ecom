import { Request, Response } from 'express';
import { shippingService } from './shipping.service';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { param } from '../../utils/param';
import { logger } from '../../utils/logger';

export const checkServiceability = asyncHandler(async (req: Request, res: Response) => {
  const result = await shippingService.checkServiceability(param(req, 'pincode'));
  sendSuccess(res, result);
});

export const createShipment = asyncHandler(async (req: Request, res: Response) => {
  const result = await shippingService.createShipment(param(req, 'orderId'));
  sendSuccess(res, result, 'Shipment created');
});

export const trackShipment = asyncHandler(async (req: Request, res: Response) => {
  const result = await shippingService.trackShipment(param(req, 'waybill'));
  sendSuccess(res, result);
});

export const webhook = async (req: Request, res: Response) => {
  try {
    await shippingService.handleWebhook(req.body);
    res.json({ received: true });
  } catch (err) {
    logger.error('Delhivery webhook error', { error: (err as Error).message });
    res.status(400).json({ error: 'Webhook handling failed' });
  }
};
