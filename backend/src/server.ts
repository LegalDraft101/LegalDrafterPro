import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('✅ Successfully connected to database');
  } catch (error: any) {
    logger.error('❌ Failed to connect to database', error.message || error);
  }

  app.listen(env.PORT, () => {
    logger.info(`🚀 API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap();
