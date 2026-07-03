import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useDashboardMetrics = (period: string = 'monthly') =>
  useQuery({
    queryKey: ['dashboard', 'metrics', period],
    queryFn: async () => {
      const { data } = await apiClient.get(`/dashboard/metrics?period=${period}`);
      return data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });
