import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { emailService } from '../notifications/email.service';
import { tokenService } from './token.service';
import type {
  RegisterInput,
  LoginInput,
  RequestOtpInput,
  VerifyOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.schema';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw AppError.conflict('Email is already registered');

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        cart: { create: {} },
        wishlist: { create: {} },
        wallet: { create: {} },
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    // Send welcome + verification email (non-blocking)
    emailService.sendWelcome(user.email, user.firstName).catch(() => {});
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.passwordReset.create({
      data: { userId: user.id, token: `verify_${verifyToken}`, expiresAt: verifyExpiry },
    });
    const verifyLink = `${env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
    emailService.sendEmailVerification(user.email, user.firstName, verifyLink).catch(() => {});

    const accessToken = tokenService.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = tokenService.generateRefreshToken();
    await tokenService.saveRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw AppError.unauthorized(
        `Account locked. Try again after ${user.lockedUntil.toLocaleTimeString()}`
      );
    }

    if (!user.isActive) throw AppError.unauthorized('Account is deactivated');

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      const attempts = user.loginAttempts + 1;
      const update: Record<string, unknown> = { loginAttempts: attempts };

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        update['lockedUntil'] = lockedUntil;
        update['loginAttempts'] = 0;
      }

      await prisma.user.update({ where: { id: user.id }, data: update });
      throw AppError.unauthorized('Invalid email or password');
    }

    // Reset login attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const accessToken = tokenService.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = tokenService.generateRefreshToken();
    await tokenService.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  async requestOtp(input: RequestOtpInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // Always return success to prevent email enumeration
    if (!user || !user.isActive) return;

    // Invalidate previous OTPs
    await prisma.otpCode.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_IN_MINUTES * 60 * 1000);

    await prisma.otpCode.create({ data: { userId: user.id, code: otp, expiresAt } });

    emailService.sendOtp(user.email, otp, user.firstName).catch(() => {});
  },

  async verifyOtp(input: VerifyOtpInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) throw AppError.unauthorized('Invalid email or OTP');

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code: input.otp,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) throw AppError.unauthorized('Invalid or expired OTP');

    await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { isUsed: true } });
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), loginAttempts: 0, lockedUntil: null },
    });

    const accessToken = tokenService.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = tokenService.generateRefreshToken();
    await tokenService.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  async refresh(oldRefreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: { select: { id: true, role: true, isActive: true } } },
    });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      if (stored) {
        await tokenService.revokeAllUserTokens(stored.userId);
      }
      throw AppError.unauthorized('Refresh token invalid or expired. Please log in again.');
    }

    if (!stored.user.isActive) throw AppError.unauthorized('Account is deactivated');

    const newRefreshToken = await tokenService.rotateRefreshToken(oldRefreshToken, stored.userId);
    const accessToken = tokenService.generateAccessToken({
      userId: stored.user.id,
      role: stored.user.role,
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    await tokenService.revokeRefreshToken(refreshToken);
  },

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // Always return success to prevent email enumeration
    if (!user || !user.isActive) return;

    // Invalidate previous tokens
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + env.PASSWORD_RESET_EXPIRES_IN_HOURS * 60 * 60 * 1000
    );

    await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    emailService.sendPasswordReset(user.email, user.firstName, resetLink).catch(() => {});
  },

  async resetPassword(input: ResetPasswordInput) {
    const record = await prisma.passwordReset.findUnique({ where: { token: input.token } });

    if (!record || record.isUsed || record.expiresAt < new Date()) {
      throw AppError.badRequest('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: record.id }, data: { isUsed: true } }),
      prisma.refreshToken.updateMany({
        where: { userId: record.userId },
        data: { isRevoked: true },
      }),
    ]);
  },

  async verifyEmail(token: string) {
    const record = await prisma.passwordReset.findUnique({ where: { token: `verify_${token}` } });
    if (!record || record.isUsed || record.expiresAt < new Date()) {
      throw AppError.badRequest('Invalid or expired verification link');
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { isEmailVerified: true } }),
      prisma.passwordReset.update({ where: { id: record.id }, data: { isUsed: true } }),
    ]);
  },

  async resendVerification(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');
    if (user.isEmailVerified) throw AppError.badRequest('Email is already verified');

    // Invalidate previous tokens
    const oldTokens = await prisma.passwordReset.findMany({
      where: { userId, isUsed: false, token: { startsWith: 'verify_' } },
    });
    for (const t of oldTokens) {
      await prisma.passwordReset.update({ where: { id: t.id }, data: { isUsed: true } });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.passwordReset.create({
      data: { userId, token: `verify_${verifyToken}`, expiresAt: verifyExpiry },
    });
    const verifyLink = `${env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
    emailService.sendEmailVerification(user.email, user.firstName, verifyLink).catch(() => {});
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) throw AppError.notFound('User not found');
    return user;
  },
};
