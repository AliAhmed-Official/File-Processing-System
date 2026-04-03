import {
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/s3';
import { config } from '../config';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export class StorageService {
  private bucket = config.S3_BUCKET;

  private maxFileSize = 500 * 1024 * 1024; // 500MB

  async generatePresignedUrl(filename: string, fileSize?: number): Promise<{ presignedUrl: string; s3Key: string }> {
    const tempId = uuidv4();
    const s3Key = `uploads/unconfirmed/${tempId}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: 'text/csv',
      ...(fileSize ? { ContentLength: fileSize } : {}),
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return { presignedUrl, s3Key };
  }

  async verifyObject(s3Key: string, expectedSize: number): Promise<void> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      });
      const response = await s3Client.send(command);

      const actualSize = response.ContentLength ?? 0;

      if (actualSize > this.maxFileSize) {
        throw ApiError.badRequest(
          `File exceeds the maximum allowed size of 500MB. Uploaded file is ${Math.round(actualSize / (1024 * 1024))}MB`
        );
      }

      if (actualSize !== expectedSize) {
        throw ApiError.badRequest(
          `File size mismatch. Expected ${expectedSize} bytes, got ${actualSize} bytes`
        );
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.notFound('File not found in S3');
    }
  }

  async moveToConfirmed(s3Key: string, jobId: string, filename: string): Promise<string> {
    const confirmedKey = `uploads/confirmed/${jobId}/${filename}`;

    await s3Client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${s3Key}`,
        Key: confirmedKey,
      })
    );

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      })
    );

    return confirmedKey;
  }

  async getObjectStream(s3Key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw ApiError.s3Error('Failed to get file stream from S3');
    }

    return response.Body as Readable;
  }

  async deleteObject(s3Key: string): Promise<void> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
        })
      );
    } catch (error) {
      logger.error('Failed to delete S3 object:', { s3Key, error });
    }
  }
}
