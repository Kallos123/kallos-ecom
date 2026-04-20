import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';

export const walletService = {
  async getWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    });
    return { balance: Number(wallet?.balance ?? 0) };
  },

  async getTransactions(userId: string, skip: number, limit: number) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return { transactions: [], total: 0 };

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);
    return { transactions, total };
  },

  // Admin: manual adjustment
  async adminAdjust(userId: string, amount: number, reason: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw AppError.notFound('Wallet not found');

    const newBalance = Number(wallet.balance) + amount;
    if (newBalance < 0) throw AppError.badRequest('Adjustment would result in negative balance');

    await prisma.$transaction([
      prisma.wallet.update({ where: { userId }, data: { balance: newBalance } }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: amount > 0 ? 'CREDIT' : 'DEBIT',
          reason: 'ADMIN_ADJUSTMENT',
          amount: Math.abs(amount),
          balanceAfter: newBalance,
          description: reason,
        },
      }),
    ]);

    return { balance: newBalance };
  },
};
