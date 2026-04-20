import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('Database connected');

    // Connect Redis (non-fatal — caching/jobs degrade gracefully without it)
    try {
      await redis.connect();
    } catch {
      logger.warn('Redis unavailable — caching and background jobs disabled');
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`KALLOS API running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`API base: http://localhost:${env.PORT}/api/${env.API_VERSION}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        await redis.quit();
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();
