import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import * as controller from './orders.controller';
import { placeOrderSchema } from './orders.schema';

const router = Router();
router.use(authenticate);

// Admin routes MUST come before /:id to avoid route conflict
router.get('/admin/all', requireAdmin, controller.adminListOrders);
router.get('/admin/:id', requireAdmin, controller.adminGetOrder);
router.patch('/admin/:id/status', requireAdmin, controller.adminUpdateStatus);
router.patch('/admin/:id/tracking', requireAdmin, controller.adminUpdateTracking);

// Customer routes
router.post('/', validate(placeOrderSchema), controller.placeOrder);
router.get('/', controller.getOrders);
router.get('/:id', controller.getOrderById);
router.patch('/:id/cancel', controller.cancelOrder);

export default router;
