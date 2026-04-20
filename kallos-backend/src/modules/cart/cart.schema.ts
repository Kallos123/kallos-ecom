import { z } from 'zod';

export const addItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().min(1).max(50),
});
