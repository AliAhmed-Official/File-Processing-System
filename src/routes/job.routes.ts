import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { jobReadRateLimiter, statsRateLimiter } from '../middleware/rateLimiter.middleware';

export const createJobRoutes = (controller: JobController): Router => {
  const router = Router();

  router.get('/stats', statsRateLimiter, controller.getStats);
  router.get('/batch/:batchId', jobReadRateLimiter, controller.getBatchStatus);
  router.get('/jobs', jobReadRateLimiter, controller.listJobs);
  router.get('/job/:id', jobReadRateLimiter, controller.getJob);
  router.get('/job/:id/result', jobReadRateLimiter, controller.getJobResult);

  return router;
};
