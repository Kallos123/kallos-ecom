import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  API_VERSION: z.string().default('v1'),

  DATABASE_URL: z.string().min(1),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  BCRYPT_ROUNDS: z.string().default('12'),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),

  DELHIVERY_API_TOKEN: z.string().min(1),
  DELHIVERY_BASE_URL: z.string().url(),
  DELHIVERY_WAREHOUSE_NAME: z.string().min(1),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().default('587'),
  SMTP_SECURE: z.string().default('false'),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1),
  EMAIL_FROM_NAME: z.string().default('KALLOS'),
  EMAIL_FROM_ADDRESS: z.string().email(),

  FRONTEND_URL: z.string().url(),
  ADMIN_FRONTEND_URL: z.string().url().optional(),

  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  AUTH_RATE_LIMIT_MAX: z.string().default('10'),

  OTP_EXPIRES_IN_MINUTES: z.string().default('5'),
  PASSWORD_RESET_EXPIRES_IN_HOURS: z.string().default('1'),
  LOW_STOCK_THRESHOLD: z.string().default('10'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  PORT: parseInt(parsed.data.PORT, 10),
  BCRYPT_ROUNDS: parseInt(parsed.data.BCRYPT_ROUNDS, 10),
  SMTP_PORT: parseInt(parsed.data.SMTP_PORT, 10),
  SMTP_SECURE: parsed.data.SMTP_SECURE === 'true',
  RATE_LIMIT_WINDOW_MS: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(parsed.data.RATE_LIMIT_MAX_REQUESTS, 10),
  AUTH_RATE_LIMIT_MAX: parseInt(parsed.data.AUTH_RATE_LIMIT_MAX, 10),
  OTP_EXPIRES_IN_MINUTES: parseInt(parsed.data.OTP_EXPIRES_IN_MINUTES, 10),
  PASSWORD_RESET_EXPIRES_IN_HOURS: parseInt(parsed.data.PASSWORD_RESET_EXPIRES_IN_HOURS, 10),
  LOW_STOCK_THRESHOLD: parseInt(parsed.data.LOW_STOCK_THRESHOLD, 10),
};
