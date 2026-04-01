import { Router } from 'express';
import { createUploadRoutes } from './upload.routes';
import { createJobRoutes } from './job.routes';
import { UploadController } from '../controllers/upload.controller';
import { JobController } from '../controllers/job.controller';

export const createRoutes = (
  uploadController: UploadController,
  jobController: JobController
): Router => {
  const router = Router();

  router.use('/upload', createUploadRoutes(uploadController));
  router.use('/', createJobRoutes(jobController));

  return router;
};
