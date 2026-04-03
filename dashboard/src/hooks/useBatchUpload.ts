import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import type { BatchPresignResponse, BatchConfirmResponse, BatchFileState, ValidationRules } from '../types/upload.types';

interface BatchUploadState {
  status: 'idle' | 'presigning' | 'uploading' | 'confirming' | 'done' | 'error';
  files: BatchFileState[];
  batchId: string | null;
  error: string | null;
}

function uploadFileToS3(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed: ${xhr.status}`));
    });
    xhr.addEventListener('error', () => reject(new Error('S3 upload network error')));
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', 'text/csv');
    xhr.send(file);
  });
}

export const useBatchUpload = () => {
  const [state, setState] = useState<BatchUploadState>({
    status: 'idle',
    files: [],
    batchId: null,
    error: null,
  });
  const queryClient = useQueryClient();

  const upload = useCallback(async (files: File[], options?: { priority?: number; validationRules?: ValidationRules }) => {
    const initialFiles: BatchFileState[] = files.map((file) => ({
      file,
      status: 'pending',
      progress: 0,
      jobId: null,
      error: null,
      s3Key: null,
    }));

    setState({ status: 'presigning', files: initialFiles, batchId: null, error: null });

    try {
      // Step 1: Batch presign
      const presign = await api.post<BatchPresignResponse>('/upload/batch/presign', {
        files: files.map((f) => ({
          filename: f.name,
          fileSize: f.size,
          mimeType: 'text/csv' as const,
        })),
      });

      const batchId = presign.batchId;

      // Update files with s3Keys
      setState((prev) => ({
        ...prev,
        status: 'uploading',
        batchId,
        files: prev.files.map((f, i) => ({
          ...f,
          s3Key: presign.files[i].s3Key,
          status: 'uploading' as const,
        })),
      }));

      // Step 2: Upload all files to S3 in parallel
      const uploadResults = await Promise.allSettled(
        files.map((file, i) =>
          uploadFileToS3(presign.files[i].presignedUrl, file, (pct) => {
            setState((prev) => ({
              ...prev,
              files: prev.files.map((f, j) => j === i ? { ...f, progress: pct } : f),
            }));
          }).then(() => {
            setState((prev) => ({
              ...prev,
              files: prev.files.map((f, j) => j === i ? { ...f, status: 'uploaded' as const, progress: 100 } : f),
            }));
          })
        )
      );

      // Check for upload failures
      const failedUploads: number[] = [];
      uploadResults.forEach((result, i) => {
        if (result.status === 'rejected') {
          failedUploads.push(i);
          setState((prev) => ({
            ...prev,
            files: prev.files.map((f, j) =>
              j === i ? { ...f, status: 'error' as const, error: result.reason?.message || 'Upload failed' } : f
            ),
          }));
        }
      });

      // Only confirm successfully uploaded files
      const successfulFiles = files
        .map((file, i) => ({ file, index: i, s3Key: presign.files[i].s3Key }))
        .filter((_, i) => !failedUploads.includes(i));

      if (successfulFiles.length === 0) {
        setState((prev) => ({ ...prev, status: 'error', error: 'All file uploads failed' }));
        return;
      }

      // Step 3: Batch confirm
      setState((prev) => ({ ...prev, status: 'confirming' }));

      const confirm = await api.post<BatchConfirmResponse>('/upload/batch/confirm', {
        batchId,
        files: successfulFiles.map((sf) => ({
          s3Key: sf.s3Key,
          originalName: sf.file.name,
          fileSize: sf.file.size,
        })),
        priority: options?.priority ?? 5,
        validationRules: options?.validationRules,
      });

      // Map jobIds back to files
      let confirmIdx = 0;
      setState((prev) => ({
        ...prev,
        status: failedUploads.length > 0 ? 'error' : 'done',
        error: failedUploads.length > 0 ? `${failedUploads.length} of ${files.length} files failed to upload` : null,
        files: prev.files.map((f, i) => {
          if (failedUploads.includes(i)) return f;
          const job = confirm.jobs[confirmIdx++];
          return { ...f, status: 'done' as const, jobId: job?.jobId ?? null };
        }),
      }));

      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Batch upload failed';
      setState((prev) => ({ ...prev, status: 'error', error: message }));
    }
  }, [queryClient]);

  const reset = useCallback(() => {
    setState({ status: 'idle', files: [], batchId: null, error: null });
  }, []);

  return { ...state, upload, reset };
};
