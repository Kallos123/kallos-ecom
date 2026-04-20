import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authenticate';
import * as controller from './reviews.controller';

const router = Router();

// Public
router.get('/product/:productId', controller.getProductReviews);

// Customer
router.post('/product/:productId', authenticate, controller.createReview);
router.patch('/:id', authenticate, controller.updateReview);
router.delete('/:id', authenticate, controller.deleteReview);

// Admin
router.get('/', authenticate, requireAdmin, controller.adminListReviews);
router.patch('/:id/moderate', authenticate, requireAdmin, controller.moderateReview);
router.delete('/:id/admin', authenticate, requireAdmin, controller.adminDeleteReview);

export default router;
