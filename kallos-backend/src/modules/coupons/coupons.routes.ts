import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import * as controller from './coupons.controller';
import { createCouponSchema, updateCouponSchema, createFlashSaleSchema, updateFlashSaleSchema } from './coupons.schema';
import { z } from 'zod';

const router = Router();

// Public
router.get('/flash-sales/active', controller.getActiveFlashSales);

// Customer
router.post('/validate', authenticate, controller.validateCoupon);

// Admin — coupons
router.get('/', authenticate, requireAdmin, controller.listCoupons);
router.post('/', authenticate, requireAdmin, validate(createCouponSchema), controller.createCoupon);
router.patch('/:id', authenticate, requireAdmin, validate(updateCouponSchema), controller.updateCoupon);
router.delete('/:id', authenticate, requireAdmin, controller.deleteCoupon);
router.get('/:id/usages', authenticate, requireAdmin, controller.getCouponUsages);

// Admin — flash sales
router.get('/flash-sales', authenticate, requireAdmin, controller.listFlashSales);
router.post('/flash-sales', authenticate, requireAdmin, validate(createFlashSaleSchema), controller.createFlashSale);
router.get('/flash-sales/:id', authenticate, requireAdmin, controller.getFlashSale);
router.patch('/flash-sales/:id', authenticate, requireAdmin, validate(updateFlashSaleSchema), controller.updateFlashSale);
router.delete('/flash-sales/:id', authenticate, requireAdmin, controller.deleteFlashSale);
router.post('/flash-sales/:id/items', authenticate, requireAdmin, controller.addFlashSaleItem);
router.delete('/flash-sales/:id/items/:itemId', authenticate, requireAdmin, controller.removeFlashSaleItem);

export default router;
