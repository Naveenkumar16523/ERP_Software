import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useBots = () =>
  useQuery({
    queryKey: ['automation', 'bots'],
    queryFn: async () => {
      const { data } = await apiClient.get('/automation/bots');
      return data?.data ?? data ?? [];
    },
    staleTime: 5000,
  });

export const useBotLogs = (botId) =>
  useQuery({
    queryKey: ['automation', 'logs', botId],
    queryFn: async () => {
      if (!botId) return [];
      const { data } = await apiClient.get(`/automation/bots/${botId}/logs`);
      return data?.data ?? data ?? [];
    },
    enabled: !!botId,
    staleTime: 1000,
  });

export const useRunBot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (botId) => {
      const { data } = await apiClient.post(`/automation/bots/${botId}/run`);
      return data;
    },
    onSuccess: (_, botId) => {
      queryClient.invalidateQueries({ queryKey: ['automation', 'bots'] });
      queryClient.invalidateQueries({ queryKey: ['automation', 'logs', botId] });
    },
  });
};
