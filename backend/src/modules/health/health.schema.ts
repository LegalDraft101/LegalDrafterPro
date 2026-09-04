export interface DbHealthStatus {
  status: 'up' | 'down';
  latencyMs: number;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  services: {
    database: DbHealthStatus;
  };
}
