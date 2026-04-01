import IORedis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

export const createRedisConnection = (): IORedis => {
  const connection = new IORedis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    maxRetriesPerRequest: null,
  });

  connection.on('connect', () => logger.info('Redis connected'));
  connection.on('error', (err) => logger.error('Redis error:', err));

  return connection;
};
