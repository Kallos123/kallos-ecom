import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import * as controller from './shipping.controller';

const router = Router();

// Public
router.get('/serviceability/:pincode', controller.checkServiceability);
router.get('/track/:waybill', controller.trackShipment);

// Webhook from Delhivery
router.post('/webhook', controller.webhook);

// Admin
router.post('/orders/:orderId/ship', authenticate, requireAdmin, controller.createShipment);

export default router;
