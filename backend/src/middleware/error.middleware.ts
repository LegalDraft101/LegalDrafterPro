import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? 500;
  const message = status >= 500 ? 'Internal server error' : (err.message || 'Bad request');
  console.error(`[${status}] ${err.message}`, err.stack ?? '');
  res.status(status).json({ error: message });
}

export default errorHandler;
