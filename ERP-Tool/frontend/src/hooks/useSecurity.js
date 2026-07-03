import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useSecurityAlerts = () =>
  useQuery({
    queryKey: ['security', 'alerts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/security/alerts');
      return data?.data ?? data ?? [];
    },
    staleTime: 10000,
  });

export const useAccessLogs = () =>
  useQuery({
    queryKey: ['security', 'accessLogs'],
    queryFn: async () => {
      const { data } = await apiClient.get('/security/access-logs');
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useUserActivities = () =>
  useQuery({
    queryKey: ['security', 'userActivities'],
    queryFn: async () => {
      const { data } = await apiClient.get('/security/user-activities');
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useComplianceItems = () =>
  useQuery({
    queryKey: ['security', 'compliance'],
    queryFn: async () => {
      const { data } = await apiClient.get('/security/compliance');
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useUpdateSecurityAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await apiClient.patch(`/security/alerts/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'alerts'] });
    },
  });
};
