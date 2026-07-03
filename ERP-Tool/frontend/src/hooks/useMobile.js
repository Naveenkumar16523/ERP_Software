import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useMobileConfig = () =>
  useQuery({
    queryKey: ['mobile', 'config'],
    queryFn: async () => {
      const { data } = await apiClient.get('/mobile/config');
      return data ?? [];
    },
    staleTime: 60_000,
  });
