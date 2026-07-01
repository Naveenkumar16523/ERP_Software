import { useOptimisticMutation } from './useOptimisticMutation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useSupportTickets = (filters) =>
  useQuery({
    queryKey: ['support', 'supportTickets', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/support/tickets', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateSupportTicket = () => useOptimisticMutation(['support', 'supportTickets'], 'post', '/support/tickets');
export const useUpdateSupportTicketStatus = () => useOptimisticMutation(['support', 'supportTickets'], 'patch', (p) => `/support/tickets/${p.id}/status`);
