import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import * as controller from './cart.controller';
import { addItemSchema, updateItemSchema } from './cart.schema';

const router = Router();
router.use(authenticate);

router.get('/admin/all', requireAdmin, controller.adminListCarts);

router.get('/', controller.getCart);
router.post('/items', validate(addItemSchema), controller.addItem);
router.patch('/items/:itemId', validate(updateItemSchema), controller.updateItem);
router.delete('/items/:itemId', controller.removeItem);
router.delete('/', controller.clearCart);

export default router;
