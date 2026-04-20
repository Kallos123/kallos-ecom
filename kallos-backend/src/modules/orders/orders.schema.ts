import { z } from 'zod';

export const placeOrderSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.enum(['RAZORPAY', 'COD', 'WALLET', 'RAZORPAY_AND_WALLET']),
  couponCode: z.string().max(30).toUpperCase().optional(),
  walletAmountToUse: z.number().min(0).optional().default(0),
  notes: z.string().max(500).optional(),
});

export const orderQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
