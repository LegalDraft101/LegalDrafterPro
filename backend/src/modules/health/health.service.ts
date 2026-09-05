import { prisma } from '../../lib/prisma';
import type { DbHealthStatus, HealthCheckResponse } from './health.schema';

export async function checkDbHealth(): Promise<DbHealthStatus> {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return { status: 'up', latencyMs };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const error = err instanceof Error ? err.message : 'Database health check failed';
    return { status: 'down', latencyMs, error };
  }
}

export async function getFullHealth(): Promise<HealthCheckResponse> {
  const dbHealth = await checkDbHealth();
  const overallStatus = dbHealth.status === 'up' ? 'ok' : 'degraded';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealth,
    },
  };
}
