import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import * as controller from './notifications.controller';

const router = Router();

router.get('/', authenticate, requireAdmin, controller.list);
router.patch('/read-all', authenticate, requireAdmin, controller.markAllRead);
router.patch('/:id/read', authenticate, requireAdmin, controller.markRead);
router.delete('/:id', authenticate, requireAdmin, controller.deleteOne);

export default router;
