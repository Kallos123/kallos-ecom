import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export const addressSchema = z.object({
  fullName: z.string().min(1).max(100).trim(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  addressLine1: z.string().min(1).max(200).trim(),
  addressLine2: z.string().max(200).trim().optional(),
  city: z.string().min(1).max(100).trim(),
  state: z.string().min(1).max(100).trim(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit pincode'),
  isDefault: z.boolean().optional().default(false),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
