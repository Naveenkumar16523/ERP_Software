import { useOptimisticMutation } from './useOptimisticMutation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';




export const useMarketingCampaigns = (filters) =>
  useQuery({
    queryKey: ['marketing', 'marketingCampaigns', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/marketing/campaigns', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateMarketingCampaign = () => useOptimisticMutation(['marketing', 'marketingCampaigns'], 'post', '/marketing/campaigns');
