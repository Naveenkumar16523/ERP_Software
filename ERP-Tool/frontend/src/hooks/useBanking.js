import { useOptimisticCreate } from './useOptimisticCreate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';




export const useBankingAccounts = (filters) =>
  useQuery({
    queryKey: ['banking', 'bankingAccounts', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/banking/accounts', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateBankingAccount = () => useOptimisticCreate(['banking', 'bankingAccounts'], '/banking/accounts');

export const useBankingTransactions = (filters) =>
  useQuery({
    queryKey: ['banking', 'bankingTransactions', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/banking/transactions', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateBankingTransaction = () => useOptimisticCreate(['banking', 'bankingTransactions'], '/banking/transactions');

export const useBankingLoans = (filters) =>
  useQuery({
    queryKey: ['banking', 'bankingLoans', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/banking/loans', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateBankingLoan = () => useOptimisticCreate(['banking', 'bankingLoans'], '/banking/loans');
