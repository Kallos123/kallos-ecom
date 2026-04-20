import { Request, Response } from 'express';
import { categoriesService } from './categories.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { param } from '../../utils/param';

// ─── Categories ──────────────────────────────────────────────────────────────

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query['includeInactive'] === 'true';
  const categories = await categoriesService.getAllCategories(includeInactive);
  sendSuccess(res, categories);
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.getCategoryBySlug(param(req, 'slug'));
  sendSuccess(res, category);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.getCategoryById(param(req, 'id'));
  sendSuccess(res, category);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.createCategory(req.body);
  sendCreated(res, category);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.updateCategory(param(req, 'id'), req.body);
  sendSuccess(res, category, 'Category updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await categoriesService.deleteCategory(param(req, 'id'));
  sendSuccess(res, null, 'Category deleted');
});

// ─── Subcategories ───────────────────────────────────────────────────────────

export const getAllSubs = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = req.query['categoryId'] as string | undefined;
  const includeInactive = req.query['includeInactive'] === 'true';
  const subs = await categoriesService.getAllSubcategories(categoryId, includeInactive);
  sendSuccess(res, subs);
});

export const getSubBySlug = asyncHandler(async (req: Request, res: Response) => {
  const sub = await categoriesService.getSubcategoryBySlug(param(req, 'slug'));
  sendSuccess(res, sub);
});

export const createSub = asyncHandler(async (req: Request, res: Response) => {
  const sub = await categoriesService.createSubcategory(req.body);
  sendCreated(res, sub);
});

export const updateSub = asyncHandler(async (req: Request, res: Response) => {
  const sub = await categoriesService.updateSubcategory(param(req, 'id'), req.body);
  sendSuccess(res, sub, 'Subcategory updated');
});

export const removeSub = asyncHandler(async (req: Request, res: Response) => {
  await categoriesService.deleteSubcategory(param(req, 'id'));
  sendSuccess(res, null, 'Subcategory deleted');
});

// ─── Images ──────────────────────────────────────────────────────────────────

export const uploadCategoryImage = asyncHandler(async (req: Request, res: Response) => {
  const { image } = req.body;
  if (!image) throw new Error('image field required');
  const category = await categoriesService.uploadCategoryImage(param(req, 'id'), image);
  sendSuccess(res, category, 'Image uploaded');
});

export const removeCategoryImage = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoriesService.removeCategoryImage(param(req, 'id'));
  sendSuccess(res, category, 'Image removed');
});

export const uploadSubcategoryImage = asyncHandler(async (req: Request, res: Response) => {
  const { image } = req.body;
  if (!image) throw new Error('image field required');
  const sub = await categoriesService.uploadSubcategoryImage(param(req, 'id'), image);
  sendSuccess(res, sub, 'Image uploaded');
});

export const removeSubcategoryImage = asyncHandler(async (req: Request, res: Response) => {
  const sub = await categoriesService.removeSubcategoryImage(param(req, 'id'));
  sendSuccess(res, sub, 'Image removed');
});

// ─── Sort Order ──────────────────────────────────────────────────────────────

export const reorderCategories = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body as { items: { id: string; sortOrder: number }[] };
  await categoriesService.reorderCategories(items);
  sendSuccess(res, null, 'Order saved');
});

export const reorderSubcategories = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body as { items: { id: string; sortOrder: number }[] };
  await categoriesService.reorderSubcategories(items);
  sendSuccess(res, null, 'Order saved');
});
