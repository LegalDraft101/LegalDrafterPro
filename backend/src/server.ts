import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';

async function bootstrap() {
  try {
    // Verify the database connection before accepting requests that require persistence.
    await prisma.$connect();
    logger.info('Successfully connected to database');
  } catch (error: unknown) {
    logger.error('Failed to connect to database', error instanceof Error ? error.message : error);
  }

  // The displayed URL comes from .env, which keeps deployment details out of code.
  app.listen(env.PORT, () => {
    logger.info(`API listening on ${env.API_URL}`);
  });
}

bootstrap();
