import { useOptimisticMutation } from './useOptimisticMutation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';




export const useSuppliers = (filters) =>
  useQuery({
    queryKey: ['procurement', 'suppliers', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/procurement/suppliers', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateSupplier = () => useOptimisticMutation(['procurement', 'suppliers'], 'post', '/procurement/suppliers');

export const usePurchaseOrders = (filters) =>
  useQuery({
    queryKey: ['procurement', 'purchaseOrders', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/procurement/orders', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreatePurchaseOrder = () => useOptimisticMutation(['procurement', 'purchaseOrders'], 'post', '/procurement/orders');
export const useApprovePurchaseOrder = () => useOptimisticMutation(['procurement', 'purchaseOrders'], 'post', (p) => `/procurement/orders/${p.id}/approve`);
export const useReceivePOItem = () => useOptimisticMutation(['procurement', 'purchaseOrders'], 'post', (p) => `/procurement/orders/items/${p.id}/receive`);

export const useRfqs = (filters) =>
  useQuery({
    queryKey: ['procurement', 'rfqs', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/procurement/rfqs', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateRfq = () => useOptimisticMutation(['procurement', 'rfqs'], 'post', '/procurement/rfqs');

export const useVendorEvaluations = (filters) =>
  useQuery({
    queryKey: ['procurement', 'vendorEvaluations', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/procurement/evaluations', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateVendorEvaluation = () => useOptimisticMutation(['procurement', 'vendorEvaluations'], 'post', '/procurement/evaluations');

export const useContracts = (filters) =>
  useQuery({
    queryKey: ['procurement', 'contracts', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/procurement/contracts', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateContract = () => useOptimisticMutation(['procurement', 'contracts'], 'post', '/procurement/contracts');
