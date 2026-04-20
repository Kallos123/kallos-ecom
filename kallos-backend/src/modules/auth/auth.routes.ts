import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rateLimiter';
import * as controller from './auth.controller';
import {
  registerSchema,
  loginSchema,
  requestOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';

const router = Router();

// Public routes (with auth rate limiter)
router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/otp/request', authLimiter, validate(requestOtpSchema), controller.requestOtp);
router.post('/otp/verify', authLimiter, validate(verifyOtpSchema), controller.verifyOtp);
router.post('/refresh', validate(refreshTokenSchema), controller.refresh);
router.post('/logout', controller.logout);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), controller.resetPassword);

// Protected
router.get('/me', authenticate, controller.getMe);
router.get('/verify-email', controller.verifyEmail);
router.post('/resend-verification', authenticate, controller.resendVerification);

export default router;
