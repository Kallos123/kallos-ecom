import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import * as controller from './products.controller';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  adjustStockSchema,
} from './products.schema';

const router = Router();

// Public
router.get('/', controller.list);
router.get('/featured', controller.getFeatured);
router.get('/slug/:slug', controller.getBySlug);
router.get('/:id', controller.getById);

// Admin — list (all products, including inactive)
router.get('/admin/all', authenticate, requireAdmin, controller.adminList);
router.patch('/admin/bulk-status', authenticate, requireAdmin, controller.bulkStatus);

// Admin — product CRUD
router.post('/', authenticate, requireAdmin, validate(createProductSchema), controller.create);
router.patch('/:id', authenticate, requireAdmin, validate(updateProductSchema), controller.update);
router.delete('/:id', authenticate, requireAdmin, controller.remove);

// Admin — images
router.post('/:id/images', authenticate, requireAdmin, controller.uploadMiddleware, controller.uploadImages);
router.patch('/:id/images/:imageId/primary', authenticate, requireAdmin, controller.setPrimaryImage);
router.delete('/:id/images/:imageId', authenticate, requireAdmin, controller.deleteImage);

// Admin — variants
router.post('/:id/variants', authenticate, requireAdmin, validate(createVariantSchema), controller.addVariant);
router.patch('/:id/variants/:variantId', authenticate, requireAdmin, validate(updateVariantSchema), controller.updateVariant);
router.patch('/:id/variants/:variantId/stock', authenticate, requireAdmin, validate(adjustStockSchema), controller.adjustStock);
router.delete('/:id/variants/:variantId', authenticate, requireAdmin, controller.deleteVariant);

export default router;
