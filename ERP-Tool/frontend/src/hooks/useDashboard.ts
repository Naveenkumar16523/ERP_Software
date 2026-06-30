import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useDashboardMetrics = () =>
  useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/metrics');
      return data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });
