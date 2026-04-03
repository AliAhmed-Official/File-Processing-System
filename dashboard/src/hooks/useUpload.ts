import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import type { PresignResponse, UploadResponse, ValidationRules, ConcurrentUploadEntry } from '../types/upload.types';

export const useUpload = () => {
  const [uploads, setUploads] = useState<Record<string, ConcurrentUploadEntry>>({});
  const queryClient = useQueryClient();

  const upload = useCallback(
    async (
      file: File,
      options?: { priority?: number; validationRules?: ValidationRules }
    ): Promise<string | null> => {
      const id = crypto.randomUUID();

      const entry: ConcurrentUploadEntry = {
        id,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: 'uploading',
        error: null,
        jobId: null,
      };

      setUploads((prev) => ({ ...prev, [id]: entry }));

      try {
        const presign = await api.post<PresignResponse>('/upload/presign', {
          filename: file.name,
          fileSize: file.size,
          mimeType: 'text/csv',
          priority: options?.priority ?? 5,
          validationRules: options?.validationRules,
        });

        const xhr = new XMLHttpRequest();
        let lastReportedProgress = 0;

        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              if (pct - lastReportedProgress >= 2 || pct === 100) {
                lastReportedProgress = pct;
                setUploads((prev) => {
                  const existing = prev[id];
                  if (!existing) return prev;
                  return { ...prev, [id]: { ...existing, progress: pct } };
                });
              }
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

        setUploads((prev) => {
          const existing = prev[id];
          if (!existing) return prev;
          return { ...prev, [id]: { ...existing, status: 'confirming' } };
        });

        const confirm = await api.post<UploadResponse>('/upload/confirm', {
          s3Key: presign.s3Key,
          originalName: file.name,
          fileSize: file.size,
          priority: options?.priority ?? 5,
          validationRules: options?.validationRules,
        });

        setUploads((prev) => {
          const existing = prev[id];
          if (!existing) return prev;
          return {
            ...prev,
            [id]: { ...existing, progress: 100, status: 'done', jobId: confirm.jobId },
          };
        });

        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });

        return confirm.jobId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setUploads((prev) => {
          const existing = prev[id];
          if (!existing) return prev;
          return { ...prev, [id]: { ...existing, status: 'error', error: message } };
        });
        return null;
      }
    },
    [queryClient]
  );

  const dismiss = useCallback((id: string) => {
    setUploads((prev) => {
      const entry = prev[id];
      if (!entry || (entry.status !== 'done' && entry.status !== 'error')) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    setUploads((prev) => {
      const next: Record<string, ConcurrentUploadEntry> = {};
      for (const [id, entry] of Object.entries(prev)) {
        if (entry.status !== 'done' && entry.status !== 'error') {
          next[id] = entry;
        }
      }
      return next;
    });
  }, []);

  return { uploads, upload, dismiss, dismissAll };
};
