import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from './useSocket';
import type { JobStatusData } from '../types/job.types';
import type { JobResultData } from '../types/result.types';

export const useJobDetail = (jobId: string) => {
  const queryClient = useQueryClient();
  const socket = useSocket(`job:${jobId}`);
  const [liveProgress, setLiveProgress] = useState<number | null>(null);

  const jobQuery = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.get<JobStatusData>(`/job/${jobId}`),
    refetchInterval: 10000,
  });

  const resultQuery = useQuery({
    queryKey: ['result', jobId],
    queryFn: () => api.get<JobResultData>(`/job/${jobId}/result`),
    enabled: jobQuery.data?.status === 'completed',
  });

  useEffect(() => {
    const onProgress = (data: { jobId: string; progress: number }) => {
      if (data.jobId === jobId) {
        setLiveProgress(data.progress);
      }
    };

    const onCompleted = (data: { jobId: string }) => {
      if (data.jobId === jobId) {
        setLiveProgress(100);
        queryClient.invalidateQueries({ queryKey: ['job', jobId] });
        queryClient.invalidateQueries({ queryKey: ['result', jobId] });
      }
    };

    const onFailed = (data: { jobId: string }) => {
      if (data.jobId === jobId) {
        queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      }
    };

    socket.on('job:progress', onProgress);
    socket.on('job:completed', onCompleted);
    socket.on('job:failed', onFailed);

    return () => {
      socket.off('job:progress', onProgress);
      socket.off('job:completed', onCompleted);
      socket.off('job:failed', onFailed);
    };
  }, [socket, jobId, queryClient]);

  return {
    job: jobQuery.data,
    result: resultQuery.data,
    progress: liveProgress ?? jobQuery.data?.progress ?? 0,
    isLoading: jobQuery.isLoading,
    error: jobQuery.error,
  };
};
