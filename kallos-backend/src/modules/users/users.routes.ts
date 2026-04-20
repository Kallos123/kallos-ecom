import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import * as controller from './users.controller';
import { updateProfileSchema, changePasswordSchema, addressSchema } from './users.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile
router.get('/profile', controller.getProfile);
router.patch('/profile', validate(updateProfileSchema), controller.updateProfile);
router.patch('/change-password', validate(changePasswordSchema), controller.changePassword);

// Addresses
router.get('/addresses', controller.getAddresses);
router.post('/addresses', validate(addressSchema), controller.addAddress);
router.put('/addresses/:id', validate(addressSchema), controller.updateAddress);
router.delete('/addresses/:id', controller.deleteAddress);
router.patch('/addresses/:id/default', controller.setDefaultAddress);

// Admin only
router.get('/', requireAdmin, controller.listUsers);
router.get('/:id', requireAdmin, controller.adminGetUser);
router.patch('/:id/status', requireAdmin, controller.setUserActive);
router.patch('/:id', requireAdmin, controller.adminUpdateUser);

export default router;
