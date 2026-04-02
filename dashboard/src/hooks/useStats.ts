import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from './useSocket';
import type { StatsData } from '../types/job.types';

export const useStats = () => {
  const queryClient = useQueryClient();
  const socket = useSocket('dashboard');

  const query = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get<StatsData>('/stats'),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    };

    socket.on('stats:update', handler);
    return () => {
      socket.off('stats:update', handler);
    };
  }, [socket, queryClient]);

  return query;
};
