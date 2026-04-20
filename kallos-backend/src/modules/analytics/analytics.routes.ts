import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import * as controller from './analytics.controller';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/summary', controller.getSummary);
router.get('/sales', controller.getSalesOverview);
router.get('/revenue-trend', controller.getRevenueTrend);
router.get('/top-products', controller.getTopProducts);
router.get('/low-stock', controller.getLowStock);
router.get('/orders/status', controller.getOrderStatusBreakdown);
router.get('/orders/payment-methods', controller.getPaymentBreakdown);
router.get('/customers', controller.getCustomerStats);
router.get('/returns', controller.getReturnStats);

export default router;
