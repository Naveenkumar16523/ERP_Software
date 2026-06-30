import { useOptimisticCreate } from './useOptimisticCreate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useOrders = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'orders', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/orders', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateOrder = () => useOptimisticCreate(['supplychain', 'orders'], '/supply-chain/orders');

export const useShipments = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'shipments', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/shipments', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateShipment = () => useOptimisticCreate(['supplychain', 'shipments'], '/supply-chain/shipments');

export const useUpdateShipmentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/supply-chain/shipments/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplychain', 'shipments'] })
  });
};

export const useUpdateShipmentPod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signatureData }) => apiClient.post(`/supply-chain/shipments/${id}/pod`, { signatureData }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplychain', 'shipments'] })
  });
};

export const useCarriers = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'carriers', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/vehicles', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateCarrier = () => useOptimisticCreate(['supplychain', 'carriers'], '/supply-chain/vehicles');

export const useRoutes = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'routes', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/routes', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateRoute = () => useOptimisticCreate(['supplychain', 'routes'], '/supply-chain/routes');

export const useFieldWorkOrders = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'fieldWorkOrders', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/field-work', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateFieldWorkOrder = () => useOptimisticCreate(['supplychain', 'fieldWorkOrders'], '/supply-chain/field-work');
