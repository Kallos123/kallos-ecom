import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import * as controller from './returns.controller';

const router = Router();
router.use(authenticate);

// Customer
router.get('/my', controller.listMyReturns);
router.post('/orders/:orderId', controller.requestReturn);
router.get('/orders/:orderId', controller.getMyReturn);

// Admin
router.get('/', requireAdmin, controller.adminListReturns);
router.patch('/:id/process', requireAdmin, controller.processReturn);

export default router;
