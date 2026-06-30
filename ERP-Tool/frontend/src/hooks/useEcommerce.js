import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useOptimisticMutation } from './useOptimisticMutation';

export const useEcommerceProducts = (filters) =>
  useQuery({
    queryKey: ['ecommerce', 'products', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/ecommerce/products', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useEcommerceOrders = (filters) =>
  useQuery({
    queryKey: ['ecommerce', 'orders', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/ecommerce/orders', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 30_000,
  });

export const useCreateEcommerceOrder = () =>
  useOptimisticMutation(['ecommerce', 'orders'], 'post', '/ecommerce/orders');
export const useUpdateEcommerceOrderStatus = () =>
  useOptimisticMutation(['ecommerce', 'orders'], 'patch', (p) => `/ecommerce/orders/${p.id}/status`);
