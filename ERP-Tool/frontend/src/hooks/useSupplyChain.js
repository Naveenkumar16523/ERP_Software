import { useOptimisticCreate } from './useOptimisticCreate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useOrders = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'orders', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/orders', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateOrder = () => useOptimisticCreate(['supplychain', 'orders'], '/supply-chain/orders');

export const useShipments = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'shipments', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/shipments', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateShipment = () => useOptimisticCreate(['supplychain', 'shipments'], '/supply-chain/shipments');

export const useUpdateShipmentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/supply-chain/shipments/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplychain', 'shipments'] })
  });
};

export const useUpdateShipmentPod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signatureData }) => apiClient.post(`/supply-chain/shipments/${id}/pod`, { signatureData }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplychain', 'shipments'] })
  });
};

export const useCarriers = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'carriers', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/vehicles', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateCarrier = () => useOptimisticCreate(['supplychain', 'carriers'], '/supply-chain/vehicles');

export const useRoutes = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'routes', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/routes', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateRoute = () => useOptimisticCreate(['supplychain', 'routes'], '/supply-chain/routes');

export const useFieldWorkOrders = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'fieldWorkOrders', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/field-work', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateFieldWorkOrder = () => useOptimisticCreate(['supplychain', 'fieldWorkOrders'], '/supply-chain/field-work');

// --- Drivers ---
export const useDrivers = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'drivers', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/drivers', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateDriver = () => useOptimisticCreate(['supplychain', 'drivers'], '/supply-chain/drivers');

export const useUpdateDriver = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.put(`/supply-chain/drivers/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplychain', 'drivers'] })
  });
};

export const useStartDuty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, startTime, notes }) => apiClient.post(`/supply-chain/drivers/${id}/duty/start`, { startTime, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplychain', 'drivers'] })
  });
};

export const useEndDuty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/supply-chain/drivers/${id}/duty/end`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplychain', 'drivers'] })
  });
};

export const useLorryReceipts = () =>
  useQuery({
    queryKey: ['supplychain', 'lr'],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/lr');
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateLorryReceipt = () => useOptimisticCreate(['supplychain', 'lr'], '/supply-chain/lr');

export const downloadLRPdf = async (id) => {
  const response = await apiClient.get(`/supply-chain/lr/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `LR-${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// --- Trips ---
export const useTrips = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'trips', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/trips', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateTrip = () => useOptimisticCreate(['supplychain', 'trips'], '/supply-chain/trips');

export const useUpdateTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.put(`/supply-chain/trips/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplychain', 'trips'] })
  });
};

export const useAssignShipmentToTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tripId }) => apiClient.put(`/supply-chain/shipments/${id}/trip`, { tripId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplychain', 'shipments'] })
  });
};

// --- Maintenance ---
export const useVehicleMaintenance = (filters) =>
  useQuery({
    queryKey: ['supplychain', 'maintenance', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/supply-chain/maintenance', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateMaintenance = () => useOptimisticCreate(['supplychain', 'maintenance'], '/supply-chain/maintenance');

export const useUpdateMaintenance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.put(`/supply-chain/maintenance/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplychain', 'maintenance'] })
  });
};
