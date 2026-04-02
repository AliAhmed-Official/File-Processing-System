import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

import { config } from './config';
import { connectDB } from './config/db';
import { createRedisConnection } from './config/redis';
import { createRoutes } from './routes';
import { UploadController } from './controllers/upload.controller';
import { JobController } from './controllers/job.controller';
import { StorageService } from './services/storage.service';
import { QueueService } from './services/queue.service';
import { JobService } from './services/job.service';
import { CacheService } from './services/cache.service';
import { socketService } from './services/socket.service';
import { createFileRepository, createJobRepository, createResultRepository } from './repositories';
import { helmetMiddleware } from './middleware/helmet.middleware';
import { corsMiddleware } from './middleware/cors.middleware';
import { sanitizeMiddleware } from './middleware/sanitize.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './utils/logger';

const startServer = async (): Promise<void> => {
  await connectDB();

  const redisConnection = createRedisConnection();

  const fileRepo = createFileRepository();
  const jobRepo = createJobRepository();
  const resultRepo = createResultRepository();

  const cacheService = new CacheService(redisConnection);
  const storageService = new StorageService();
  const queueService = new QueueService(redisConnection);
  const jobService = new JobService(jobRepo, fileRepo, resultRepo, cacheService);

  const uploadController = new UploadController(storageService, queueService, fileRepo, jobRepo);
  const jobController = new JobController(jobService);

  const app = express();
  const httpServer = createServer(app);

  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.SOCKET_CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  const pubClient = createRedisConnection();
  const subClient = createRedisConnection();
  io.adapter(createAdapter(pubClient, subClient));

  socketService.initialize(io);

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json());
  //app.use(sanitizeMiddleware);

  app.get('/health', async (_req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  });

  app.use('/api', createRoutes(uploadController, jobController));

  app.use(errorMiddleware);

  httpServer.listen(config.PORT, () => {
    logger.info(`API server running on port ${config.PORT}`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
