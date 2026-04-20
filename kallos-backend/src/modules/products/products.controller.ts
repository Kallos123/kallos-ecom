import { Request, Response } from 'express';
import multer from 'multer';
import { productsService } from './products.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { param } from '../../utils/param';
import { productQuerySchema } from './products.schema';
import { AppError } from '../../utils/AppError';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadMiddleware = upload.array('images', 10);

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const query = productQuerySchema.parse(req.query);
  const { page, limit, skip } = getPagination(req);
  const { products, total } = await productsService.adminList(query, skip, limit);
  sendSuccess(res, products, 'Success', 200, buildPaginationMeta(total, page, limit));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = productQuerySchema.parse(req.query);
  const { page, limit, skip } = getPagination(req);
  const { products, total } = await productsService.list(query, skip, limit);
  sendSuccess(res, products, 'Success', 200, buildPaginationMeta(total, page, limit));
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.getBySlug(param(req, 'slug'));
  sendSuccess(res, product);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.getById(param(req, 'id'));
  sendSuccess(res, product);
});

export const getFeatured = asyncHandler(async (_req: Request, res: Response) => {
  const products = await productsService.getFeatured();
  sendSuccess(res, products);
});

export const bulkStatus = asyncHandler(async (req: Request, res: Response) => {
  const { ids, isActive } = req.body as { ids: string[]; isActive: boolean };
  if (!Array.isArray(ids) || ids.length === 0) throw AppError.badRequest('ids array required');
  const result = await productsService.bulkUpdateStatus(ids, Boolean(isActive));
  sendSuccess(res, result, `${result.count} product(s) updated`);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.create(req.body);
  sendCreated(res, product);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.update(param(req, 'id'), req.body);
  sendSuccess(res, product, 'Product updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await productsService.delete(param(req, 'id'));
  sendSuccess(res, null, 'Product deleted');
});

// ─── Images ──────────────────────────────────────────────────────────────────

export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) throw AppError.badRequest('No files uploaded');
  const images = await productsService.uploadImages(param(req, 'id'), files);
  sendCreated(res, images, 'Images uploaded');
});

export const setPrimaryImage = asyncHandler(async (req: Request, res: Response) => {
  await productsService.setPrimaryImage(param(req, 'id'), param(req, 'imageId'));
  sendSuccess(res, null, 'Primary image updated');
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  await productsService.deleteImage(param(req, 'id'), param(req, 'imageId'));
  sendSuccess(res, null, 'Image deleted');
});

// ─── Variants ────────────────────────────────────────────────────────────────

export const addVariant = asyncHandler(async (req: Request, res: Response) => {
  const variant = await productsService.addVariant(param(req, 'id'), req.body);
  sendCreated(res, variant);
});

export const updateVariant = asyncHandler(async (req: Request, res: Response) => {
  const variant = await productsService.updateVariant(param(req, 'id'), param(req, 'variantId'), req.body);
  sendSuccess(res, variant, 'Variant updated');
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const variant = await productsService.adjustStock(param(req, 'id'), param(req, 'variantId'), req.body);
  sendSuccess(res, variant, 'Stock adjusted');
});

export const deleteVariant = asyncHandler(async (req: Request, res: Response) => {
  await productsService.deleteVariant(param(req, 'id'), param(req, 'variantId'));
  sendSuccess(res, null, 'Variant deleted');
});
