import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useOptimisticCreate } from './useOptimisticCreate';

export const usePayrolls = (filters) =>
  useQuery({
    queryKey: ['payroll', 'payrolls', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/payroll/payrolls', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreatePayroll = () => useOptimisticCreate(['payroll', 'payrolls'], '/payroll/payrolls');

export const useSalaryStructures = (filters) =>
  useQuery({
    queryKey: ['payroll', 'salaryStructures', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/payroll/structures', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateSalaryStructure = () => useOptimisticCreate(['payroll', 'salaryStructures'], '/payroll/structures');

export const usePayslips = (filters) =>
  useQuery({
    queryKey: ['payroll', 'payslips', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/payroll/payslips', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreatePayslip = () => useOptimisticCreate(['payroll', 'payslips'], '/payroll/payslips');

export const useTaxRules = () =>
  useQuery({
    queryKey: ['payroll', 'taxRules'],
    queryFn: async () => {
      const { data } = await apiClient.get('/payroll/rules');
      return data?.data ?? data ?? [];
    }
  });

export const useCreateTaxRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rule) => apiClient.post('/payroll/rules', rule).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll', 'taxRules'] })
  });
};

export const useGeneratePayroll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }) => apiClient.post('/payroll/generate', { month, year }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll', 'payrolls'] })
  });
};

export const useProcessPayroll = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/payroll/${id}/process`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll', 'payrolls'] })
  });
};

export const useSendPayslip = () => {
  return useMutation({
    mutationFn: (id) => apiClient.post(`/payroll/payslips/${id}/send-payslip`).then(r => r.data)
  });
};

