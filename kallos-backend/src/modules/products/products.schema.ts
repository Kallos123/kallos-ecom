import { z } from 'zod';

export const variantSchema = z.object({
  size: z.string().max(20).trim().optional(),
  color: z.string().max(50).trim().optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  sku: z.string().max(100).trim().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().min(1).trim(),
  basePrice: z.number().positive(),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  brand: z.string().max(100).trim().optional(),
  material: z.string().max(200).trim().optional(),
  careInstructions: z.string().max(500).trim().optional(),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  tags: z.array(z.string().trim().toLowerCase()).max(20).optional().default([]),
  variants: z.array(variantSchema).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial().omit({ variants: true }).extend({
  subcategoryId: z.string().uuid().nullish(),
});

export const updateVariantSchema = variantSchema.partial().extend({
  stock: z.number().int().min(0).optional(),
});

export const createVariantSchema = variantSchema;

export const adjustStockSchema = z.object({
  delta: z.number().int(),
  reason: z.string().optional(),
});

export const productQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().max(200).trim().optional(),
  category: z.string().optional(), // id
  subcategory: z.string().optional(), // id
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  minRating: z.string().optional(),
  inStock: z.string().optional(),
  isFeatured: z.string().optional(),
  lowStock: z.string().optional(),
  outOfStock: z.string().optional(),
  sortBy: z
    .enum(['price_asc', 'price_desc', 'newest', 'rating', 'popularity'])
    .optional()
    .default('newest'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
