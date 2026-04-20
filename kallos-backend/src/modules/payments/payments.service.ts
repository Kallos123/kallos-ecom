import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { emailService } from '../notifications/email.service';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const paymentsService = {
  async createRazorpayOrder(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) throw AppError.notFound('Order not found');
    if (order.orderStatus !== 'PENDING_PAYMENT') {
      throw AppError.badRequest('Order is not awaiting payment');
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.totalAmount) * 100), // paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: order.id, userId },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: env.RAZORPAY_KEY_ID,
      orderNumber: order.orderNumber,
    };
  },

  async verifyPayment(payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== payload.razorpaySignature) {
      throw AppError.badRequest('Payment verification failed: invalid signature');
    }

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId: payload.razorpayOrderId },
      include: { user: { select: { email: true, firstName: true } } },
    });

    if (!order) throw AppError.notFound('Order not found for this payment');

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          razorpayPaymentId: payload.razorpayPaymentId,
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED',
        },
      }),
      prisma.orderStatusHistory.create({
        data: { orderId: order.id, status: 'CONFIRMED', note: 'Payment confirmed' },
      }),
    ]);

    emailService
      .sendOrderConfirmation(
        order.user.email,
        order.user.firstName,
        order.orderNumber,
        Number(order.totalAmount).toFixed(2)
      )
      .catch(() => {});

    return { orderId: order.id, orderNumber: order.orderNumber };
  },

  async handleWebhook(rawBody: Buffer, signature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw AppError.unauthorized('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString());

    if (event.event === 'payment.failed') {
      const razorpayOrderId = event.payload?.payment?.entity?.order_id;
      if (razorpayOrderId) {
        await prisma.order.updateMany({
          where: { razorpayOrderId, orderStatus: 'PENDING_PAYMENT' },
          data: { paymentStatus: 'FAILED', orderStatus: 'PAYMENT_FAILED' },
        });
      }
    }
  },

  async initiateRefund(orderId: string, amount: number, reason?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || !order.razorpayPaymentId) {
      throw AppError.badRequest('No online payment found for this order');
    }

    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: Math.round(amount * 100),
      notes: { reason: reason ?? 'Return approved', orderId },
    });

    return refund;
  },
};
