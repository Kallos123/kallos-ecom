import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import * as controller from './settings.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/',         controller.getAll);
router.post('/batch',   controller.updateBatch);
router.patch('/:key',   controller.updateOne);

export default router;
