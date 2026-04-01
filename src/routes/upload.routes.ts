import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { uploadRateLimiter, batchRateLimiter } from '../middleware/rateLimiter.middleware';

export const createUploadRoutes = (controller: UploadController): Router => {
  const router = Router();

  router.post('/presign', uploadRateLimiter, controller.presign);
  router.post('/confirm', uploadRateLimiter, controller.confirm);
  router.post('/batch/presign', batchRateLimiter, controller.batchPresign);
  router.post('/batch/confirm', batchRateLimiter, controller.batchConfirm);

  return router;
};
