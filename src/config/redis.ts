import IORedis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

export const createRedisConnection = (): IORedis => {
  const connection = new IORedis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,

    // DON'T use 0 - it causes immediate timeout
    // Instead, use very large values or omit these options
    connectTimeout: 60000,     // 60 seconds
    commandTimeout: 300000,    // 5 minutes

    // IMPORTANT: Remove socketTimeout or set to undefined
    // socketTimeout: undefined,  // Don't include this line

    // Keep alive settings
    keepAlive: 10000,

    retryStrategy(times) {
      return Math.min(times * 200, 5000);
    },
    reconnectOnError(err) {
      return true;
    },
  });

  connection.on('connect', () => logger.info('Redis connected'));
  connection.on('error', (err) => logger.error('Redis error:', err));

  // Heartbeat to keep connection alive
  let heartbeatInterval: NodeJS.Timeout;
  connection.on('ready', () => {
    heartbeatInterval = setInterval(() => {
      if (connection.status === 'ready') {
        connection.ping().catch(() => { });
      }
    }, 30000);
  });

  connection.on('close', () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  });

  return connection;
};