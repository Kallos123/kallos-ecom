import { Router } from 'express';
import express from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as controller from './payments.controller';

const router = Router();

// Webhook must receive raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), controller.webhook);

// Protected
router.post('/orders/:orderId/create', authenticate, controller.createOrder);
router.post('/verify', authenticate, controller.verifyPayment);

export default router;
