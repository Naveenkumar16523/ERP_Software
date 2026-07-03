import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useAIConversations = () =>
  useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: async () => {
      const { data } = await apiClient.get('/ai/conversations');
      return data ?? [];
    },
    staleTime: 60_000,
  });

export const useAIMessages = (conversationId) =>
  useQuery({
    queryKey: ['ai', 'messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data } = await apiClient.get(`/ai/conversations/${conversationId}/messages`);
      return data ?? [];
    },
    enabled: !!conversationId,
    staleTime: 60_000,
  });

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post('/ai/chat', payload),
    onSuccess: (_, variables) => {
      if (variables.conversationId) {
        qc.invalidateQueries({ queryKey: ['ai', 'messages', variables.conversationId] });
      }
      qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    }
  });
};
