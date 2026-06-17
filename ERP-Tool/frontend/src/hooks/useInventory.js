import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/products');
      return data.data;
    }
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product) => {
      const { data } = await apiClient.post('/inventory/products', product);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useTransactions = () => {
  return useQuery({
    queryKey: ['stock-transactions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/stock-transactions');
      return data.data;
    }
  });
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction) => {
      const { data } = await apiClient.post('/inventory/stock-transactions', transaction);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      // Updating a stock transaction probably affects products
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useWarehouses = () => {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/warehouses');
      return data.data || data;
    }
  });
};

export const useBatches = () => {
  return useQuery({
    queryKey: ['inventory-batches'],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/batches');
      return data.data || data;
    }
  });
};
