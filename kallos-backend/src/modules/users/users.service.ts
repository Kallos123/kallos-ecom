import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import type { UpdateProfileInput, ChangePasswordInput, AddressInput } from './users.schema';

export const usersService = {
  async getProfile(userId: string) {
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

  async updateProfile(userId: string, input: UpdateProfileInput) {
    return prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw AppError.badRequest('No password set on this account');

    const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isMatch) throw AppError.badRequest('Current password is incorrect');

    const passwordHash = await bcrypt.hash(input.newPassword, env.BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true } }),
    ]);
  },

  // ─── Addresses ─────────────────────────────────────────────────────────────

  async getAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  },

  async addAddress(userId: string, input: AddressInput) {
    return prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }

      const count = await tx.address.count({ where: { userId } });
      const isDefault = input.isDefault || count === 0; // first address is default

      return tx.address.create({
        data: { ...input, userId, isDefault },
      });
    });
  },

  async updateAddress(userId: string, addressId: string, input: AddressInput) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw AppError.notFound('Address not found');

    return prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      return tx.address.update({ where: { id: addressId }, data: input });
    });
  },

  async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw AppError.notFound('Address not found');

    await prisma.address.delete({ where: { id: addressId } });

    // If deleted address was default, make the most recent one default
    if (address.isDefault) {
      const next = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  },

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw AppError.notFound('Address not found');

    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
      prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
    ]);
  },

  // ─── Admin ──────────────────────────────────────────────────────────────────

  async listUsers(page: number, limit: number, skip: number, search?: string) {
    let where: any = { role: 'CUSTOMER' };
    if (search) {
      const parts = search.trim().split(/\s+/);
      const orConditions: any[] = [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
      ];
      // "First Last" full-name search
      if (parts.length >= 2) {
        orConditions.push({
          AND: [
            { firstName: { contains: parts[0], mode: 'insensitive' as const } },
            { lastName: { contains: parts.slice(1).join(' '), mode: 'insensitive' as const } },
          ],
        });
      }
      where = { role: 'CUSTOMER', OR: orConditions };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          wallet: { select: { balance: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const normalized = users.map((u) => ({
      ...u,
      walletBalance: Number(u.wallet?.balance ?? 0),
      wallet: undefined,
    }));

    return { users: normalized, total };
  },

  async adminGetUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        wallet: { select: { balance: true } },
        addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
      },
    });
    if (!user) throw AppError.notFound('User not found');
    return {
      ...user,
      walletBalance: Number(user.wallet?.balance ?? 0),
      wallet: undefined,
    };
  },

  async adminUpdateUser(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    });
  },

  async setUserActive(userId: string, isActive: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');
    if (user.role === 'ADMIN') throw AppError.forbidden('Cannot deactivate admin account');

    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, isActive: true },
    });
  },
};
