import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const from = `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS}>`;

async function send(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({ from, to, subject, html });
    logger.info(`Email sent: ${subject}`, { to });
  } catch (err) {
    logger.error('Failed to send email', { to, subject, error: err });
    throw err;
  }
}

export const emailService = {
  async sendOtp(to: string, otp: string, firstName: string) {
    await send(
      to,
      'Your KALLOS login code',
      `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Hi ${firstName},</h2>
        <p>Your one-time login code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:16px;background:#f5f5f5;text-align:center;border-radius:8px">${otp}</div>
        <p style="color:#666;font-size:13px">This code expires in ${env.OTP_EXPIRES_IN_MINUTES} minutes. Do not share it with anyone.</p>
      </div>
      `
    );
  },

  async sendWelcome(to: string, firstName: string) {
    await send(
      to,
      'Welcome to KALLOS',
      `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Welcome to KALLOS, ${firstName}!</h2>
        <p>Your account has been created. Start exploring our collection.</p>
      </div>
      `
    );
  },

  async sendPasswordReset(to: string, firstName: string, resetLink: string) {
    await send(
      to,
      'Reset your KALLOS password',
      `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Hi ${firstName},</h2>
        <p>We received a request to reset your password.</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:4px;margin:16px 0">Reset Password</a>
        <p style="color:#666;font-size:13px">This link expires in ${env.PASSWORD_RESET_EXPIRES_IN_HOURS} hour(s). If you didn't request this, ignore this email.</p>
      </div>
      `
    );
  },

  async sendOrderConfirmation(to: string, firstName: string, orderNumber: string, total: string) {
    await send(
      to,
      `Order confirmed — ${orderNumber}`,
      `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Order Confirmed!</h2>
        <p>Hi ${firstName}, we've received your order.</p>
        <p><strong>Order:</strong> ${orderNumber}</p>
        <p><strong>Total:</strong> ₹${total}</p>
        <p>We'll notify you when it ships.</p>
      </div>
      `
    );
  },

  async sendOrderShipped(
    to: string,
    firstName: string,
    orderNumber: string,
    trackingId: string,
    courier: string
  ) {
    await send(
      to,
      `Your order is on the way — ${orderNumber}`,
      `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Your order has shipped!</h2>
        <p>Hi ${firstName}, your order <strong>${orderNumber}</strong> is on its way.</p>
        <p><strong>Courier:</strong> ${courier}</p>
        <p><strong>Tracking ID:</strong> ${trackingId}</p>
      </div>
      `
    );
  },

  async sendRefundProcessed(to: string, firstName: string, amount: string, method: string) {
    await send(
      to,
      'Your refund has been processed',
      `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Refund Processed</h2>
        <p>Hi ${firstName}, your refund of <strong>₹${amount}</strong> has been processed to your ${method}.</p>
        <p style="color:#666;font-size:13px">Bank transfers may take 5–7 business days to reflect.</p>
      </div>
      `
    );
  },

  async sendEmailVerification(to: string, firstName: string, verifyLink: string) {
    await send(
      to,
      'Verify your KALLOS email',
      `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Hi ${firstName}, verify your email</h2>
        <p>Click the button below to verify your email address.</p>
        <a href="${verifyLink}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:4px;margin:16px 0">Verify Email</a>
        <p style="color:#666;font-size:13px">This link expires in 24 hours. If you didn't create a KALLOS account, ignore this email.</p>
      </div>
      `
    );
  },

  async sendLowStockAlert(to: string, productName: string, sku: string, stock: number) {
    await send(
      to,
      `Low stock alert: ${productName}`,
      `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Low Stock Alert</h2>
        <p><strong>${productName}</strong> (SKU: ${sku}) is running low.</p>
        <p>Current stock: <strong style="color:#e53e3e">${stock} units</strong></p>
        <p>Please restock soon to avoid lost sales.</p>
      </div>
      `
    );
  },
};
