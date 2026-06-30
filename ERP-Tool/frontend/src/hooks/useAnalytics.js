import { useOptimisticCreate } from './useOptimisticCreate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';




export const useKpis = (filters) =>
  useQuery({
    queryKey: ['analytics', 'kpis', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/kpis', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateKpi = () => useOptimisticCreate(['analytics', 'kpis'], '/analytics/kpis');

export const useReports = (filters) =>
  useQuery({
    queryKey: ['analytics', 'reports', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/reports', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateReport = () => useOptimisticCreate(['analytics', 'reports'], '/analytics/reports');

export const useDashboards = (filters) =>
  useQuery({
    queryKey: ['analytics', 'dashboards', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/dashboards', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateDashboard = () => useOptimisticCreate(['analytics', 'dashboards'], '/analytics/dashboards');
