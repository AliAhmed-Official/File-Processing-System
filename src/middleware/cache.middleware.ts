import { Request, Response, NextFunction } from 'express';
import { ICacheService } from '../interfaces/ICacheService';

export const createCacheMiddleware = (cache: ICacheService, keyFn: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = keyFn(req);
    const cached = await cache.get<unknown>(key);

    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    next();
  };
};
