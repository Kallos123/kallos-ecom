import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import * as controller from './wallet.controller';

const router = Router();
router.use(authenticate);

router.get('/', controller.getWallet);
router.get('/transactions', controller.getTransactions);
router.post('/admin/adjust', requireAdmin, controller.adminAdjust);

export default router;
