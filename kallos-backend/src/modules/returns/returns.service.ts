import { prisma } from '../../config/database';
import { AppError } from '../../utils/AppError';
import { paymentsService } from '../payments/payments.service';
import { emailService } from '../notifications/email.service';
import { notificationsService } from '../notifications/notifications.service';
import { z } from 'zod';

const RETURN_WINDOW_DAYS = 7;

export const requestReturnSchema = z.object({
  reason: z.enum(['WRONG_SIZE', 'WRONG_ITEM', 'DEFECTIVE', 'NOT_AS_DESCRIBED', 'CHANGED_MIND', 'OTHER']),
  description: z.string().max(500).optional(),
  refundMethod: z.enum(['ORIGINAL_PAYMENT', 'WALLET']),
});

export const returnsService = {
  async requestReturn(userId: string, orderId: string, input: z.infer<typeof requestReturnSchema>) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { returnRequest: true },
    });

    if (!order) throw AppError.notFound('Order not found');
    if (order.orderStatus !== 'DELIVERED') throw AppError.badRequest('Only delivered orders can be returned');
    if (order.returnRequest) throw AppError.conflict('Return request already exists for this order');

    const deliveredAt = order.updatedAt;
    const windowEnd = new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    if (new Date() > windowEnd) {
      throw AppError.badRequest(`Return window of ${RETURN_WINDOW_DAYS} days has passed`);
    }

    if (input.refundMethod === 'ORIGINAL_PAYMENT' && order.paymentMethod === 'COD') {
      throw AppError.badRequest('COD orders can only be refunded to wallet');
    }

    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        reason: input.reason,
        description: input.description,
        refundMethod: input.refundMethod,
        status: 'REQUESTED',
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: 'RETURN_REQUESTED' },
    });

    notificationsService.create({
      type: 'NEW_RETURN',
      title: 'Return Request',
      message: `Return requested for order #${order.orderNumber}`,
      link: '/admin/returns',
    }).catch(() => {});

    return returnRequest;
  },

  async listMyReturns(userId: string) {
    return prisma.returnRequest.findMany({
      where: { order: { userId } },
      include: { order: { select: { id: true, orderNumber: true, totalAmount: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getMyReturn(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw AppError.notFound('Order not found');

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { orderId },
      include: { refund: true },
    });
    if (!returnRequest) throw AppError.notFound('No return request found');
    return returnRequest;
  },

  // Admin
  async listReturnRequests(status: string | undefined, skip: number, limit: number) {
    const where = status ? { status: status as any } : {};
    const [requests, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              paymentMethod: true,
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
      prisma.returnRequest.count({ where }),
    ]);
    return { requests, total };
  },

  async processReturn(returnRequestId: string, approved: boolean, adminNote?: string) {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        order: {
          include: { user: { select: { id: true, email: true, firstName: true } } },
        },
      },
    });

    if (!returnRequest) throw AppError.notFound('Return request not found');
    if (returnRequest.status !== 'REQUESTED') throw AppError.badRequest('Return request is not pending');

    if (!approved) {
      await prisma.$transaction([
        prisma.returnRequest.update({ where: { id: returnRequestId }, data: { status: 'REJECTED', adminNote } }),
        prisma.order.update({ where: { id: returnRequest.orderId }, data: { orderStatus: 'RETURN_REJECTED' } }),
        prisma.orderStatusHistory.create({ data: { orderId: returnRequest.orderId, status: 'RETURN_REJECTED', note: adminNote } }),
      ]);
      return { approved: false };
    }

    // Approved — process refund
    const refundAmount = Number(returnRequest.order.totalAmount);
    const { id: userId, email, firstName } = returnRequest.order.user;

    await prisma.$transaction(async (tx) => {
      await tx.returnRequest.update({ where: { id: returnRequestId }, data: { status: 'APPROVED', adminNote } });
      await tx.order.update({ where: { id: returnRequest.orderId }, data: { orderStatus: 'RETURN_APPROVED' } });
      await tx.orderStatusHistory.create({ data: { orderId: returnRequest.orderId, status: 'RETURN_APPROVED', note: adminNote } });

      const refundRecord = await tx.refund.create({
        data: {
          returnRequestId,
          amount: refundAmount,
          method: returnRequest.refundMethod,
          status: 'INITIATED',
        },
      });

      if (returnRequest.refundMethod === 'WALLET') {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        const newBalance = Number(wallet!.balance) + refundAmount;
        await tx.wallet.update({ where: { userId }, data: { balance: newBalance } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet!.id,
            type: 'CREDIT',
            reason: 'REFUND',
            amount: refundAmount,
            balanceAfter: newBalance,
            referenceId: refundRecord.id,
          },
        });
        await tx.refund.update({ where: { id: refundRecord.id }, data: { status: 'COMPLETED', processedAt: new Date() } });
      }

      return refundRecord;
    });

    // Online refund (outside transaction to avoid long-running Razorpay call)
    if (returnRequest.refundMethod === 'ORIGINAL_PAYMENT') {
      try {
        const razorpayRefund = await paymentsService.initiateRefund(returnRequest.orderId, refundAmount, 'Return approved');
        await prisma.refund.update({
          where: { returnRequestId },
          data: { razorpayRefundId: razorpayRefund.id, status: 'PROCESSING' },
        });
      } catch {
        // Log and leave as INITIATED for retry
      }
    }

    emailService.sendRefundProcessed(
      email,
      firstName,
      refundAmount.toFixed(2),
      returnRequest.refundMethod === 'WALLET' ? 'KALLOS Wallet' : 'original payment method'
    ).catch(() => {});

    return { approved: true };
  },
};
