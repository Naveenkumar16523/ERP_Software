import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useOptimisticMutation } from './useOptimisticMutation';

// ── Accounts ──
export const useAccounts = () =>
  useQuery({
    queryKey: ['finance', 'accounts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/accounts');
      return data?.data ?? data ?? [];
    },
    staleTime: 2 * 60_000,
  });

export const useCreateAccount = () => useOptimisticMutation(['finance', 'accounts'], 'post', '/finance/accounts');

// ── Invoices ──
export const useInvoices = (filters) =>
  useQuery({
    queryKey: ['finance', 'invoices', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/invoices', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 30_000,
  });

export const useCreateInvoice = () => useOptimisticMutation(['finance', 'invoices'], 'post', '/finance/invoices');
export const useUpdateInvoiceStatus = () => useOptimisticMutation(['finance', 'invoices'], 'patch', (p) => `/finance/invoices/${p.id}/status`);

// ── Journal Entries ──
export const useJournalEntries = () =>
  useQuery({
    queryKey: ['finance', 'journalEntries'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/journal-entries');
      return data?.data ?? data ?? [];
    },
    staleTime: 30_000,
  });

export const useCreateJournalEntry = () => useOptimisticMutation(['finance', 'journalEntries'], 'post', '/finance/journal-entries');

// ── Budgets ──
export const useBudgets = () =>
  useQuery({
    queryKey: ['finance', 'budgets'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/budgets');
      return data?.data ?? data ?? [];
    },
    staleTime: 5 * 60_000,
  });

export const useCreateBudget = () => useOptimisticMutation(['finance', 'budgets'], 'post', '/finance/budgets');

// ── Expenses ──
export const useExpenses = () =>
  useQuery({
    queryKey: ['finance', 'expenses'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/expenses');
      return data?.data ?? data ?? [];
    },
    staleTime: 30_000,
  });

export const useCreateExpense = () => useOptimisticMutation(['finance', 'expenses'], 'post', '/finance/expenses');
export const useUpdateExpenseStatus = () => useOptimisticMutation(['finance', 'expenses'], 'patch', (p) => `/finance/expenses/${p.id}/status`);

// ── Tax Deadlines ──
export const useTaxDeadlines = () =>
  useQuery({
    queryKey: ['finance', 'taxDeadlines'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/tax-deadlines');
      return data?.data ?? data ?? [];
    },
    staleTime: 5 * 60_000,
  });

export const useCreateTaxDeadline = () => useOptimisticMutation(['finance', 'taxDeadlines'], 'post', '/finance/tax-deadlines');
export const useUpdateTaxDeadlineStatus = () => useOptimisticMutation(['finance', 'taxDeadlines'], 'patch', (p) => `/finance/tax-deadlines/${p.id}/status`);

// ── Statements ──
export const useStatements = () =>
  useQuery({
    queryKey: ['finance', 'statements'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/statements');
      return data?.data ?? data ?? [];
    },
    staleTime: 5 * 60_000,
  });

export const useCreateStatement = () => useOptimisticMutation(['finance', 'statements'], 'post', '/finance/statements');
export const useUpdateStatementStatus = () => useOptimisticMutation(['finance', 'statements'], 'patch', (p) => `/finance/statements/${p.id}/status`);

// ── Approval Workflows ──
export const useApprovalWorkflows = () =>
  useQuery({
    queryKey: ['finance', 'approvalWorkflows'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/approval-workflows');
      return data?.data ?? data ?? [];
    },
    staleTime: 5 * 60_000,
  });

export const useCreateApprovalWorkflow = () => useOptimisticMutation(['finance', 'approvalWorkflows'], 'post', '/finance/approval-workflows');
export const useApproveApprovalWorkflow = () => useOptimisticMutation(['finance', 'approvalWorkflows'], 'post', (p) => `/finance/approval-workflows/${p.id}/approve`);
