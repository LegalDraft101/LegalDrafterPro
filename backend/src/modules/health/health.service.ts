import { supabase } from '../../config/supabase';
import type { DbHealthStatus, HealthCheckResponse } from './health.schema';

export async function checkDbHealth(): Promise<DbHealthStatus> {
  const start = Date.now();

  try {
    const { data, error } = await supabase.rpc('check_db_reachable');
    const latencyMs = Date.now() - start;

    if (error) {
      return { status: 'down', latencyMs, error: error.message };
    }

    if (data !== true) {
      return { status: 'down', latencyMs, error: 'Database reachability check returned an unexpected result.' };
    }

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
