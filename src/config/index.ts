import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  MONGO_URI: z.string().min(1),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),

  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ENDPOINT: z.string().optional(),

  QUEUE_CONCURRENCY: z.coerce.number().default(3),
  QUEUE_MAX_RETRIES: z.coerce.number().default(3),
  QUEUE_RATE_LIMIT_MAX: z.coerce.number().default(10),
  QUEUE_RATE_LIMIT_DURATION: z.coerce.number().default(60000),

  DUPLICATE_HASH_THRESHOLD_BYTES: z.coerce.number().default(52428800),

  SOCKET_CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
