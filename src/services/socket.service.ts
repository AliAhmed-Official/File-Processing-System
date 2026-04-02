import { Server as SocketServer } from 'socket.io';
import { Emitter } from '@socket.io/redis-emitter';
import IORedis from 'ioredis';
import { logger } from '../utils/logger';

export class SocketService {
  private io: SocketServer | null = null;
  private emitter: Emitter | null = null;

  initialize(io: SocketServer): void {
    this.io = io;

    io.on('connection', (socket) => {
      logger.debug('Client connected:', socket.id);

      socket.on('join:job', (jobId: string) => {
        socket.join(`job:${jobId}`);
      });

      socket.on('leave:job', (jobId: string) => {
        socket.leave(`job:${jobId}`);
      });

      socket.on('join:batch', (batchId: string) => {
        socket.join(`batch:${batchId}`);
      });

      socket.on('leave:batch', (batchId: string) => {
        socket.leave(`batch:${batchId}`);
      });

      socket.on('join:dashboard', () => {
        socket.join('dashboard');
      });

      socket.on('leave:dashboard', () => {
        socket.leave('dashboard');
      });

      socket.on('disconnect', () => {
        logger.debug('Client disconnected:', socket.id);
      });
    });
  }

  initializeEmitter(redisClient: IORedis): void {
    this.emitter = new Emitter(redisClient);
    logger.info('Socket emitter initialized for worker process');
  }

  emitJobProgress(jobId: string, progress: number): void {
    if (this.io) {
      this.io.to(`job:${jobId}`).to('dashboard').emit('job:progress', { jobId, progress });
    } else if (this.emitter) {
      this.emitter.to(`job:${jobId}`).to('dashboard').emit('job:progress', { jobId, progress });
    }
  }

  emitJobCompleted(jobId: string, resultId: string): void {
    if (this.io) {
      this.io.to(`job:${jobId}`).emit('job:completed', { jobId, resultId });
      this.io.to('dashboard').emit('stats:update');
    } else if (this.emitter) {
      this.emitter.to(`job:${jobId}`).emit('job:completed', { jobId, resultId });
      this.emitter.to('dashboard').emit('stats:update');
    }
  }

  emitJobFailed(jobId: string, error: string, attempt: number): void {
    if (this.io) {
      this.io.to(`job:${jobId}`).emit('job:failed', { jobId, error, attempt });
      this.io.to('dashboard').emit('stats:update');
    } else if (this.emitter) {
      this.emitter.to(`job:${jobId}`).emit('job:failed', { jobId, error, attempt });
      this.emitter.to('dashboard').emit('stats:update');
    }
  }

  emitStatsUpdate(): void {
    if (this.io) {
      this.io.to('dashboard').emit('stats:update');
    } else if (this.emitter) {
      this.emitter.to('dashboard').emit('stats:update');
    }
  }

  emitBatchUpdate(batchId: string, completed: number, total: number): void {
    if (this.io) {
      this.io.to(`batch:${batchId}`).emit('batch:update', { batchId, completed, total });
    } else if (this.emitter) {
      this.emitter.to(`batch:${batchId}`).emit('batch:update', { batchId, completed, total });
    }
  }
}

export const socketService = new SocketService();