import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from './useSocket';
import type { JobListData, JobListFilters } from '../types/job.types';

export const useJobs = (filters: JobListFilters = {}) => {
  const queryClient = useQueryClient();
  const socket = useSocket('dashboard');

  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.batchId) params.set('batchId', filters.batchId);
  if (filters.priority) params.set('priority', String(filters.priority));

  const query = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.get<JobListData>(`/jobs?${params.toString()}`),
  });

  useEffect(() => {
    const handleStatsUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    };

    const handleProgress = ({ jobId, progress }: { jobId: string; progress: number }) => {
      queryClient.setQueriesData<JobListData>(
        { queryKey: ['jobs'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            jobs: old.jobs.map((job) =>
              job.jobId === jobId ? { ...job, progress, status: 'processing' as const } : job
            ),
          };
        }
      );
    };

    socket.on('stats:update', handleStatsUpdate);
    socket.on('job:progress', handleProgress);
    return () => {
      socket.off('stats:update', handleStatsUpdate);
      socket.off('job:progress', handleProgress);
    };
  }, [socket, queryClient]);

  return query;
};
