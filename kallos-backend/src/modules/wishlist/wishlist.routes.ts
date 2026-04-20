import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import * as controller from './wishlist.controller';

const router = Router();
router.use(authenticate);

router.get('/admin/all', requireAdmin, controller.adminListWishlists);

router.get('/', controller.getWishlist);
router.post('/:productId/toggle', controller.toggle);

export default router;
