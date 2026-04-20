import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { prisma } from '../config/database';

export interface JwtPayload {
  userId: string;
  role: string;
  tokenVersion?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return next(AppError.unauthorized('No token provided'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) return next(AppError.unauthorized('No token provided'));

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return next(AppError.unauthorized('Account not found or deactivated'));
    }

    req.user = { id: user.id, role: user.role };
    return next();
  } catch {
    return next(AppError.unauthorized('Invalid or expired token'));
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(AppError.forbidden('Admin access required'));
  }
  return next();
};

export const requireCustomer = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'CUSTOMER') {
    return next(AppError.forbidden('Customer access required'));
  }
  return next();
};
