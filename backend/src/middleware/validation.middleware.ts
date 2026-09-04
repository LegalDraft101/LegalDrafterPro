import type { Request, Response, NextFunction } from 'express';

export function maskForLog(value: unknown): string {
  if (value == null) return 'null';
  if (typeof value === 'string') return value.length > 4 ? value.slice(0, 2) + '***' : '***';
  if (typeof value === 'object') return '[object]';
  return '***';
}

export function validateBodyRequired(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const field of fields) {
      if (!req.body || req.body[field] === undefined) {
        res.status(400).json({ error: `Missing required field: ${field}` });
        return;
      }
    }
    next();
  };
}
