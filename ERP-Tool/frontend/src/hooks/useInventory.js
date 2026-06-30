import { useOptimisticCreate } from './useOptimisticCreate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';




export const useProducts = (filters) =>
  useQuery({
    queryKey: ['inventory', 'products', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/products', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateProduct = () => useOptimisticCreate(['inventory', 'products'], '/inventory/products');

export const useWarehouses = (filters) =>
  useQuery({
    queryKey: ['inventory', 'warehouses', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/warehouses', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateWarehouse = () => useOptimisticCreate(['inventory', 'warehouses'], '/inventory/warehouses');

export const useStockMovements = (filters) =>
  useQuery({
    queryKey: ['inventory', 'stockMovements', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/stock-transactions', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateStockMovement = () => useOptimisticCreate(['inventory', 'stockMovements'], '/inventory/stock-transactions');

export const useInventoryBatches = (filters) =>
  useQuery({
    queryKey: ['inventory', 'inventoryBatches', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/inventory/batches', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateInventoryBatche = () => useOptimisticCreate(['inventory', 'inventoryBatches'], '/inventory/batches');
