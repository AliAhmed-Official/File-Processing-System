import { Request, Response, NextFunction } from 'express';

function sanitizeObject(obj: Record<string, any>): void {
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

export const sanitizeMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') sanitizeObject(req.body);
  if (req.params && typeof req.params === 'object') sanitizeObject(req.params);
  if (req.query && typeof req.query === 'object') sanitizeObject(req.query as Record<string, any>);
  next();
};
