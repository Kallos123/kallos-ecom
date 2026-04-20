import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import categoryRoutes from './modules/categories/categories.routes';
import productRoutes from './modules/products/products.routes';
import cartRoutes from './modules/cart/cart.routes';
import wishlistRoutes from './modules/wishlist/wishlist.routes';
import orderRoutes from './modules/orders/orders.routes';
import paymentRoutes from './modules/payments/payments.routes';
import couponRoutes from './modules/coupons/coupons.routes';
import reviewRoutes from './modules/reviews/reviews.routes';
import returnRoutes from './modules/returns/returns.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import shippingRoutes from './modules/shipping/shipping.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import settingsRoutes from './modules/settings/settings.routes';

const app = express();

// ─── Security ───────────────────────────────
app.use(helmet());
const allowedOrigins = [env.FRONTEND_URL, env.ADMIN_FRONTEND_URL].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

// ─── Body Parsing ────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate Limiting ───────────────────────────
app.use(generalLimiter);

// ─── Request Logging ─────────────────────────
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, { query: req.query });
  next();
});

// ─── Health Check ────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'KALLOS API is running', version: env.API_VERSION });
});

// ─── API Routes ──────────────────────────────
const apiPrefix = `/api/${env.API_VERSION}`;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/categories`, categoryRoutes);
app.use(`${apiPrefix}/products`, productRoutes);
app.use(`${apiPrefix}/cart`, cartRoutes);
app.use(`${apiPrefix}/wishlist`, wishlistRoutes);
app.use(`${apiPrefix}/orders`, orderRoutes);
app.use(`${apiPrefix}/payments`, paymentRoutes);
app.use(`${apiPrefix}/coupons`, couponRoutes);
app.use(`${apiPrefix}/reviews`, reviewRoutes);
app.use(`${apiPrefix}/returns`, returnRoutes);
app.use(`${apiPrefix}/wallet`, walletRoutes);
app.use(`${apiPrefix}/shipping`, shippingRoutes);
app.use(`${apiPrefix}/analytics`, analyticsRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use(`${apiPrefix}/settings`,     settingsRoutes);

// ─── 404 Handler ─────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handler ───────────────────────────
app.use(errorHandler);

export default app;
