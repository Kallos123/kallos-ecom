import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

export const tokenService = {
  generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  },

  generateRefreshToken(): string {
    return uuidv4();
  },

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    } catch {
      throw AppError.unauthorized('Invalid or expired access token');
    }
  },

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  },

  async rotateRefreshToken(
    oldToken: string,
    userId: string
  ): Promise<string> {
    const stored = await prisma.refreshToken.findUnique({ where: { token: oldToken } });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      // Revoke all tokens for this user (token reuse detected)
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
      throw AppError.unauthorized('Refresh token invalid or expired. Please log in again.');
    }

    // Revoke old token, issue new one
    await prisma.refreshToken.update({
      where: { token: oldToken },
      data: { isRevoked: true },
    });

    const newToken = uuidv4();
    await tokenService.saveRefreshToken(userId, newToken);
    return newToken;
  },

  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  },

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  },
};
