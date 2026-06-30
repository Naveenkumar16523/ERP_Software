import { useOptimisticCreate } from './useOptimisticCreate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';




export const useSecurityThreats = (filters) =>
  useQuery({
    queryKey: ['security', 'securityThreats', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/security/threats', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateSecurityThreat = () => useOptimisticCreate(['security', 'securityThreats'], '/security/threats');

export const useSecurityAuditLog = (filters) =>
  useQuery({
    queryKey: ['security', 'securityAuditLog', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/security/audit-log', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateSecurityAuditLo = () => useOptimisticCreate(['security', 'securityAuditLog'], '/security/audit-log');
