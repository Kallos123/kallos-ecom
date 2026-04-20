import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(30)
    .toUpperCase()
    .regex(/^[A-Z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens and underscores'),
  description: z.string().max(200).optional(),
  type: z.enum(['PERCENTAGE', 'FLAT', 'FREE_SHIPPING']),
  value: z.number().min(0),
  minOrderValue: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  isFirstTimeOnly: z.boolean().default(false),
  totalUsageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema.partial().omit({ code: true });

export const applyCouponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
});

export const createFlashSaleSchema = z.object({
  name: z.string().min(1).max(100),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isActive: z.boolean().default(true),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        discountType: z.enum(['PERCENTAGE', 'FLAT', 'FREE_SHIPPING']),
        discountValue: z.number().positive(),
      })
    )
    .optional()
    .default([]),
});

export const updateFlashSaleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type CreateFlashSaleInput = z.infer<typeof createFlashSaleSchema>;
export type UpdateFlashSaleInput = z.infer<typeof updateFlashSaleSchema>;
