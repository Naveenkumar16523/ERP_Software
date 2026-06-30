import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useOptimisticMutation } from './useOptimisticMutation';

export const useMachines = (filters) =>
  useQuery({
    queryKey: ['manufacturing', 'machines', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/manufacturing/machines', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateMachine = () =>
  useOptimisticMutation(['manufacturing', 'machines'], 'post', '/manufacturing/machines');

export const useUpdateMachineStatus = () => 
  useOptimisticMutation(['manufacturing', 'machines'], 'patch', (p) => `/manufacturing/machines/${p.id}/status`);

export const useWorkOrders = (filters) =>
  useQuery({
    queryKey: ['manufacturing', 'workOrders', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/manufacturing/work-orders', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 30_000,
  });

export const useCreateWorkOrder = () =>
  useOptimisticMutation(['manufacturing', 'workOrders'], 'post', '/manufacturing/work-orders');

export const useUpdateWorkOrderStatus = () =>
  useOptimisticMutation(['manufacturing', 'workOrders'], 'patch', (p) => `/manufacturing/work-orders/${p.id}/status`);

export const useDowntimeLogs = (filters) =>
  useQuery({
    queryKey: ['manufacturing', 'downtimeLogs', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/manufacturing/downtime', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateDowntimeLog = () =>
  useOptimisticMutation(['manufacturing', 'downtimeLogs'], 'post', '/manufacturing/downtime');
