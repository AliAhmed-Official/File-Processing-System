import { S3Client } from '@aws-sdk/client-s3';
import { config } from './index';

export const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
  ...(config.S3_ENDPOINT && {
    endpoint: config.S3_ENDPOINT,
    forcePathStyle: true,
  }),
});
