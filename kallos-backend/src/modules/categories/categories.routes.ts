import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import * as controller from './categories.controller';
import {
  createCategorySchema,
  updateCategorySchema,
  createSubcategorySchema,
  updateSubcategorySchema,
} from './categories.schema';

const router = Router();

// ─── Subcategories (must come before /:id to avoid conflicts) ─────────────────
router.get('/subcategories', controller.getAllSubs);
router.get('/subcategories/slug/:slug', controller.getSubBySlug);
router.post('/subcategories', authenticate, requireAdmin, validate(createSubcategorySchema), controller.createSub);
// sort-order must come before /:id
router.patch('/subcategories/sort-order', authenticate, requireAdmin, controller.reorderSubcategories);
router.patch('/subcategories/:id', authenticate, requireAdmin, validate(updateSubcategorySchema), controller.updateSub);
router.delete('/subcategories/:id', authenticate, requireAdmin, controller.removeSub);
router.post('/subcategories/:id/image', authenticate, requireAdmin, controller.uploadSubcategoryImage);
router.delete('/subcategories/:id/image', authenticate, requireAdmin, controller.removeSubcategoryImage);

// ─── Categories (public read, admin write) ───────────────────────────────────
router.get('/', controller.getAll);
router.get('/slug/:slug', controller.getBySlug);
// sort-order must come before /:id
router.patch('/sort-order', authenticate, requireAdmin, controller.reorderCategories);
router.post('/', authenticate, requireAdmin, validate(createCategorySchema), controller.create);
router.get('/:id', controller.getById);
router.patch('/:id', authenticate, requireAdmin, validate(updateCategorySchema), controller.update);
router.delete('/:id', authenticate, requireAdmin, controller.remove);
router.post('/:id/image', authenticate, requireAdmin, controller.uploadCategoryImage);
router.delete('/:id/image', authenticate, requireAdmin, controller.removeCategoryImage);

export default router;
