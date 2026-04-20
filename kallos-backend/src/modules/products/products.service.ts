import slugify from 'slugify';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { cloudinary } from '../../config/cloudinary';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';
import { emailService } from '../notifications/email.service';
import { logger } from '../../utils/logger';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
  CreateVariantInput,
  UpdateVariantInput,
  AdjustStockInput,
} from './products.schema';

function makeSlug(name: string) {
  return slugify(name, { lower: true, strict: true });
}

async function ensureUniqueSlug(name: string, excludeId?: string) {
  let slug = makeSlug(name);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const exists = await prisma.product.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    if (!exists) return candidate;
    suffix++;
  }
}

function generateSku(name: string, size?: string, color?: string): string {
  const namePart = name.slice(0, 4).toUpperCase().replace(/\s/g, '');
  const sizePart = (size ?? 'OS').toUpperCase().slice(0, 3);
  const colorPart = (color ?? 'NA').toUpperCase().slice(0, 3);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${namePart}-${sizePart}-${colorPart}-${rand}`;
}

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  basePrice: true,
  brand: true,
  material: true,
  careInstructions: true,
  isFeatured: true,
  isActive: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  subcategory: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' as const }, select: { id: true, url: true, isPrimary: true } },
  tags: { select: { tag: true } },
  variants: {
    where: { isActive: true },
    select: { id: true, size: true, color: true, colorHex: true, sku: true, price: true, stock: true, isActive: true },
  },
  _count: { select: { reviews: true } },
} satisfies Prisma.ProductSelect;

export const productsService = {
  async adminList(query: ProductQuery, skip: number, limit: number) {
    const where: Prisma.ProductWhereInput = {};

    if (query.subcategory) {
      where['subcategoryId'] = query.subcategory;
    } else if (query.category) {
      where['categoryId'] = query.category;
    }

    if (query.search) {
      where['OR'] = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.lowStock === 'true') {
      // stock > 0 but at or below threshold — explicitly excludes out-of-stock
      where['variants'] = { some: { stock: { gt: 0, lte: 10 } } };
    } else if (query.outOfStock === 'true') {
      // no variant has stock > 0
      where['variants'] = { none: { stock: { gt: 0 } } };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          isActive: true,
          isFeatured: true,
          category: { select: { id: true, name: true } },
          images: { select: { id: true, url: true, sortOrder: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
          variants: { select: { id: true, stock: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  },

  async list(query: ProductQuery, skip: number, limit: number) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.subcategory) {
      where['subcategoryId'] = query.subcategory;
    } else if (query.category) {
      // filter by category — includes all products in that category regardless of subcategory
      where['categoryId'] = query.category;
    }

    if (query.inStock === 'true') {
      where['variants'] = { some: { stock: { gt: 0 }, isActive: true } };
    }
    if (query.isFeatured === 'true') where['isFeatured'] = true;
    if (query.minPrice || query.maxPrice) {
      where['basePrice'] = {};
      if (query.minPrice) where['basePrice']['gte'] = parseFloat(query.minPrice);
      if (query.maxPrice) where['basePrice']['lte'] = parseFloat(query.maxPrice);
    }
    if (query.size) {
      where['variants'] = { some: { size: { equals: query.size, mode: 'insensitive' }, isActive: true } };
    }
    if (query.color) {
      where['variants'] = { some: { color: { contains: query.color, mode: 'insensitive' }, isActive: true } };
    }
    if (query.minRating) {
      where['reviews'] = {
        some: { rating: { gte: parseFloat(query.minRating) }, status: 'APPROVED' },
      };
    }

    // Full-text search via PostgreSQL
    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    if (query.search) {
      where['OR'] = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { some: { tag: { contains: query.search, mode: 'insensitive' } } } },
        { brand: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    switch (query.sortBy) {
      case 'price_asc':
        orderBy = [{ basePrice: 'asc' }];
        break;
      case 'price_desc':
        orderBy = [{ basePrice: 'desc' }];
        break;
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      default:
        orderBy = [{ createdAt: 'desc' }];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy, select: productSelect }),
      prisma.product.count({ where }),
    ]);

    const productsWithSale = await Promise.all(products.map(attachFlashSalePrice));
    return { products: productsWithSale, total };
  },

  async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        ...productSelect,
        variants: {
          select: { id: true, size: true, color: true, colorHex: true, sku: true, price: true, stock: true, isActive: true },
        },
        reviews: {
          where: { status: 'APPROVED' },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, rating: true, title: true, body: true, createdAt: true, user: { select: { firstName: true } } },
        },
      },
    });
    if (!product || !product.isActive) throw AppError.notFound('Product not found');
    return attachFlashSalePrice(product);
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({ where: { id }, select: productSelect });
    if (!product) throw AppError.notFound('Product not found');
    return attachFlashSalePrice(product);
  },

  async bulkUpdateStatus(ids: string[], isActive: boolean) {
    return prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });
  },

  async create(input: CreateProductInput) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw AppError.badRequest('Category not found');

    const slug = await ensureUniqueSlug(input.name);

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          basePrice: input.basePrice,
          categoryId: input.categoryId,
          brand: input.brand,
          material: input.material,
          careInstructions: input.careInstructions,
          isFeatured: input.isFeatured,
          isActive: input.isActive,
          tags: {
            create: input.tags.map((tag) => ({ tag })),
          },
          variants: {
            create: input.variants.map((v) => ({
              ...v,
              sku: v.sku ?? generateSku(input.name, v.size, v.color),
            })),
          },
        },
        select: productSelect,
      });
      return product;
    });
  },

  async update(id: string, input: UpdateProductInput) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw AppError.notFound('Product not found');

    if (input.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!category) throw AppError.badRequest('Category not found');
    }

    const slug = input.name ? await ensureUniqueSlug(input.name, id) : undefined;

    return prisma.$transaction(async (tx) => {
      if (input.tags !== undefined) {
        const uniqueTags = [...new Set(input.tags)];
        await tx.productTag.deleteMany({ where: { productId: id } });
        await tx.productTag.createMany({ data: uniqueTags.map((tag) => ({ productId: id, tag })) });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...input,
          ...(slug ? { slug } : {}),
          tags: undefined,
        },
        select: productSelect,
      });
    });
  },

  async delete(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw AppError.notFound('Product not found');

    // Soft delete — just deactivate
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  },

  // ─── Images ──────────────────────────────────────────────────────────────

  async uploadImages(productId: string, files: Express.Multer.File[]) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw AppError.notFound('Product not found');

    const existingCount = await prisma.productImage.count({ where: { productId } });
    const hasPrimary = existingCount === 0;

    const uploads = await Promise.all(
      files.map(async (file, index) => {
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          { folder: `kallos/products/${productId}`, resource_type: 'image' }
        );
        return {
          productId,
          url: result.secure_url,
          publicId: result.public_id,
          isPrimary: hasPrimary && index === 0,
          sortOrder: existingCount + index,
        };
      })
    );

    await prisma.productImage.createMany({ data: uploads });
    return prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: 'asc' } });
  },

  async setPrimaryImage(productId: string, imageId: string) {
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw AppError.notFound('Image not found');

    await prisma.$transaction([
      prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
      prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);
  },

  async deleteImage(productId: string, imageId: string) {
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw AppError.notFound('Image not found');

    await cloudinary.uploader.destroy(image.publicId);
    await prisma.productImage.delete({ where: { id: imageId } });

    // If deleted was primary, promote next
    if (image.isPrimary) {
      const next = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  },

  // ─── Variants ────────────────────────────────────────────────────────────

  async addVariant(productId: string, input: CreateVariantInput) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw AppError.notFound('Product not found');

    const sku = input.sku ?? generateSku(product.name, input.size, input.color);
    return prisma.productVariant.create({ data: { ...input, productId, sku } });
  },

  async updateVariant(productId: string, variantId: string, input: UpdateVariantInput) {
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
    if (!variant) throw AppError.notFound('Variant not found');

    return prisma.productVariant.update({ where: { id: variantId }, data: input });
  },

  async deleteVariant(productId: string, variantId: string) {
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
    if (!variant) throw AppError.notFound('Variant not found');

    await prisma.productVariant.delete({ where: { id: variantId } });
  },

  async adjustStock(productId: string, variantId: string, input: AdjustStockInput) {
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
    if (!variant) throw AppError.notFound('Variant not found');

    const newStock = variant.stock + input.delta;
    if (newStock < 0) throw AppError.badRequest('Stock cannot go below zero');

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock },
    });

    // Low stock alert
    if (updated.stock <= env.LOW_STOCK_THRESHOLD && updated.stock > 0) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
      logger.warn(`Low stock alert: ${product?.name} (SKU: ${updated.sku}) — ${updated.stock} units remaining`);
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { email: true } });
      if (admin) {
        emailService.sendLowStockAlert(admin.email, product?.name ?? 'Unknown', updated.sku, updated.stock).catch(() => {});
      }
    }

    return updated;
  },

  async getFeatured() {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: productSelect,
    });
    return Promise.all(products.map(attachFlashSalePrice));
  },
};

// Attach active flash sale price to a product object
async function attachFlashSalePrice<T extends { id: string; basePrice: unknown }>(product: T): Promise<T & { salePrice: number | null; discountType: string | null; discountValue: number | null }> {
  const now = new Date();
  const saleItem = await prisma.flashSaleItem.findFirst({
    where: {
      productId: product.id,
      flashSale: { isActive: true, startTime: { lte: now }, endTime: { gte: now } },
    },
  });

  if (!saleItem) return { ...product, salePrice: null, discountType: null, discountValue: null };

  const base = Number(product.basePrice);
  const value = Number(saleItem.discountValue);
  let salePrice: number;

  if (saleItem.discountType === 'PERCENTAGE') {
    salePrice = Math.max(0, base - (base * value) / 100);
  } else {
    salePrice = Math.max(0, base - value);
  }

  return {
    ...product,
    salePrice: Math.round(salePrice * 100) / 100,
    discountType: saleItem.discountType,
    discountValue: value,
  };
}
