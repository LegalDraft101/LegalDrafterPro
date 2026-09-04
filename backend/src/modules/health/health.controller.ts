import { Request, Response } from 'express';
import { checkDbHealth, getFullHealth } from './health.service';

/**
 * GET /health/db — Returns Database health status
 */
export async function getDbHealth(_req: Request, res: Response): Promise<void> {
  const dbStatus = await checkDbHealth();
  const statusCode = dbStatus.status === 'up' ? 200 : 503;
  res.status(statusCode).json(dbStatus);
}

/**
 * GET /health — Returns overall application & services health
 */
export async function getSystemHealth(_req: Request, res: Response): Promise<void> {
  const health = await getFullHealth();
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
}
