import { useState } from 'react';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import type { PresignResponse, UploadResponse, ValidationRules } from '../types/upload.types';

interface UploadState {
  progress: number;
  status: 'idle' | 'uploading' | 'confirming' | 'done' | 'error';
  error: string | null;
  jobId: string | null;
}

export const useUpload = () => {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    status: 'idle',
    error: null,
    jobId: null,
  });
  const queryClient = useQueryClient();

  const upload = async (
    file: File,
    options?: { priority?: number; validationRules?: ValidationRules }
  ): Promise<string | null> => {
    try {
      setState({ progress: 0, status: 'uploading', error: null, jobId: null });

      const presign = await api.post<PresignResponse>('/upload/presign', {
        filename: file.name,
        fileSize: file.size,
        mimeType: 'text/csv',
        priority: options?.priority ?? 5,
        validationRules: options?.validationRules,
      });

      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setState((prev) => ({ ...prev, progress: Math.round((e.loaded / e.total) * 100) }));
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`S3 upload failed: ${xhr.status}`));
        });
        xhr.addEventListener('error', () => reject(new Error('S3 upload network error')));

        xhr.open('PUT', presign.presignedUrl);
        xhr.setRequestHeader('Content-Type', 'text/csv');
        xhr.send(file);
      });

      console.log('File uploaded to S3, confirming with backend...');

      setState((prev) => ({ ...prev, status: 'confirming' }));

      const confirm = await api.post<UploadResponse>('/upload/confirm', {
        s3Key: presign.s3Key,
        originalName: file.name,
        fileSize: file.size,
        priority: options?.priority ?? 5,
        validationRules: options?.validationRules,
      });

      setState({ progress: 100, status: 'done', error: null, jobId: confirm.jobId });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      return confirm.jobId;
    } catch (err) {
      console.log(err)
      const message = err instanceof Error ? err.message : 'Upload failed';
      setState((prev) => ({ ...prev, status: 'error', error: message }));
      return null;
    }
  };

  const reset = () => {
    setState({ progress: 0, status: 'idle', error: null, jobId: null });
  };

  return { ...state, upload, reset };
};
