import slugify from 'slugify';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import { cloudinary } from '../../config/cloudinary';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateSubcategoryInput,
  UpdateSubcategoryInput,
} from './categories.schema';

function makeSlug(name: string) {
  return slugify(name, { lower: true, strict: true });
}

async function ensureUniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
  let slug = makeSlug(name);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const exists = await prisma.category.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    if (!exists) return candidate;
    suffix++;
  }
}

async function ensureUniqueSubcategorySlug(name: string, excludeId?: string): Promise<string> {
  let slug = makeSlug(name);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const exists = await prisma.subcategory.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    if (!exists) return candidate;
    suffix++;
  }
}

export const categoriesService = {
  // ─── Categories ────────────────────────────────────────────────────────────

  async getAllCategories(includeInactive = false) {
    return prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true, subcategories: true } } },
    });
  },

  async getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        subcategories: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true } },
      },
    });
    if (!category) throw AppError.notFound('Category not found');
    return category;
  },

  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true, subcategories: true } },
      },
    });
    if (!category) throw AppError.notFound('Category not found');
    return category;
  },

  async createCategory(input: CreateCategoryInput) {
    const slug = await ensureUniqueCategorySlug(input.name);
    return prisma.category.create({ data: { ...input, slug } });
  },

  async updateCategory(id: string, input: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw AppError.notFound('Category not found');
    const slug = input.name ? await ensureUniqueCategorySlug(input.name, id) : undefined;
    return prisma.category.update({
      where: { id },
      data: { ...input, ...(slug ? { slug } : {}) },
    });
  },

  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { subcategories: true, products: true } } },
    });
    if (!category) throw AppError.notFound('Category not found');
    if (category._count.subcategories > 0)
      throw AppError.badRequest('Cannot delete a category that has subcategories');
    if (category._count.products > 0)
      throw AppError.badRequest('Cannot delete a category that has products');
    await prisma.category.delete({ where: { id } });
  },

  // ─── Subcategories ─────────────────────────────────────────────────────────

  async getAllSubcategories(categoryId?: string, includeInactive = false) {
    return prisma.subcategory.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });
  },

  async getSubcategoryBySlug(slug: string) {
    const sub = await prisma.subcategory.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });
    if (!sub) throw AppError.notFound('Subcategory not found');
    return sub;
  },

  async createSubcategory(input: CreateSubcategoryInput) {
    const parent = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!parent) throw AppError.badRequest('Parent category not found');
    const slug = await ensureUniqueSubcategorySlug(input.name);
    return prisma.subcategory.create({ data: { ...input, slug } });
  },

  async updateSubcategory(id: string, input: UpdateSubcategoryInput) {
    const sub = await prisma.subcategory.findUnique({ where: { id } });
    if (!sub) throw AppError.notFound('Subcategory not found');
    if (input.categoryId) {
      const parent = await prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!parent) throw AppError.badRequest('Parent category not found');
    }
    const slug = input.name ? await ensureUniqueSubcategorySlug(input.name, id) : undefined;
    return prisma.subcategory.update({
      where: { id },
      data: { ...input, ...(slug ? { slug } : {}) },
    });
  },

  async deleteSubcategory(id: string) {
    const sub = await prisma.subcategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!sub) throw AppError.notFound('Subcategory not found');
    if (sub._count.products > 0)
      throw AppError.badRequest('Cannot delete a subcategory that has products');
    await prisma.subcategory.delete({ where: { id } });
  },

  // ─── Images ────────────────────────────────────────────────────────────────

  async uploadCategoryImage(id: string, image: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw AppError.notFound('Category not found');
    const result = await cloudinary.uploader.upload(image, {
      folder: 'kallos/categories',
      resource_type: 'image',
    });
    return prisma.category.update({ where: { id }, data: { imageUrl: result.secure_url } });
  },

  async removeCategoryImage(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw AppError.notFound('Category not found');
    return prisma.category.update({ where: { id }, data: { imageUrl: null } });
  },

  async uploadSubcategoryImage(id: string, image: string) {
    const sub = await prisma.subcategory.findUnique({ where: { id } });
    if (!sub) throw AppError.notFound('Subcategory not found');
    const result = await cloudinary.uploader.upload(image, {
      folder: 'kallos/subcategories',
      resource_type: 'image',
    });
    return prisma.subcategory.update({ where: { id }, data: { imageUrl: result.secure_url } });
  },

  async removeSubcategoryImage(id: string) {
    const sub = await prisma.subcategory.findUnique({ where: { id } });
    if (!sub) throw AppError.notFound('Subcategory not found');
    return prisma.subcategory.update({ where: { id }, data: { imageUrl: null } });
  },

  // ─── Sort Order ────────────────────────────────────────────────────────────

  async reorderCategories(items: { id: string; sortOrder: number }[]) {
    await Promise.all(
      items.map(({ id, sortOrder }) =>
        prisma.category.update({ where: { id }, data: { sortOrder } })
      )
    );
  },

  async reorderSubcategories(items: { id: string; sortOrder: number }[]) {
    await Promise.all(
      items.map(({ id, sortOrder }) =>
        prisma.subcategory.update({ where: { id }, data: { sortOrder } })
      )
    );
  },
};
