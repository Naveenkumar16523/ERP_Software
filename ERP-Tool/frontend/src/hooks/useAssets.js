import { useOptimisticCreate } from './useOptimisticCreate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';




export const useAssets = (filters) =>
  useQuery({
    queryKey: ['assets', 'assets', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/assets/assets', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateAsset = () => useOptimisticCreate(['assets', 'assets'], '/assets/assets');

export const useDepreciationRecords = (filters) =>
  useQuery({
    queryKey: ['assets', 'depreciationRecords', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/assets/depreciation', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateDepreciationRecord = () => useOptimisticCreate(['assets', 'depreciationRecords'], '/assets/depreciation');

export const useMaintenanceSchedules = (filters) =>
  useQuery({
    queryKey: ['assets', 'maintenanceSchedules', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/assets/maintenance', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateMaintenanceSchedule = () => useOptimisticCreate(['assets', 'maintenanceSchedules'], '/assets/maintenance');
