import { Request, Response } from 'express';
import { paymentsService } from './payments.service';
import { sendSuccess } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { param } from '../../utils/param';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const verifySchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentsService.createRazorpayOrder(param(req, 'orderId'), req.user!.id);
  sendSuccess(res, result, 'Razorpay order created');
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const payload = verifySchema.parse(req.body);
  const result = await paymentsService.verifyPayment(payload);
  sendSuccess(res, result, 'Payment verified successfully');
});

export const webhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      logger.warn('Razorpay webhook received without signature');
      return res.status(400).json({ error: 'Missing signature' });
    }
    await paymentsService.handleWebhook(req.body as Buffer, signature);
    res.json({ received: true });
  } catch (err) {
    logger.error('Razorpay webhook error', { error: (err as Error).message });
    res.status(400).json({ error: 'Webhook handling failed' });
  }
};
