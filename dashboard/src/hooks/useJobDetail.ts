import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from './useSocket';
import type { JobStatusData } from '../types/job.types';
import type { JobResultData } from '../types/result.types';

export const useJobDetail = (jobId: string) => {
  const queryClient = useQueryClient();
  const socket = useSocket(`job:${jobId}`);

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
    const onCompleted = (data: { jobId: string }) => {
      if (data.jobId === jobId) {
        queryClient.invalidateQueries({ queryKey: ['job', jobId] });
        queryClient.invalidateQueries({ queryKey: ['result', jobId] });
      }
    };

    const onFailed = (data: { jobId: string }) => {
      if (data.jobId === jobId) {
        queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      }
    };

    socket.on('job:completed', onCompleted);
    socket.on('job:failed', onFailed);

    return () => {
      socket.off('job:completed', onCompleted);
      socket.off('job:failed', onFailed);
    };
  }, [socket, jobId, queryClient]);

  return {
    job: jobQuery.data,
    result: resultQuery.data,
    isLoading: jobQuery.isLoading,
    error: jobQuery.error,
  };
};
