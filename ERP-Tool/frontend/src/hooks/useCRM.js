import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOptimisticMutation } from './useOptimisticMutation';
import { apiClient } from '../api/client';

export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/leads');
      return data?.data ?? data ?? [];
    }
  });
};

export const useAddLead = () => useOptimisticMutation(['leads'], 'post', '/crm/leads');

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...lead }) => {
      const { data } = await apiClient.put(`/crm/leads/${id}`, lead);
      return data?.data ?? data ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });
};

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await apiClient.patch(`/crm/leads/${id}/status`, { status });
      return data?.data ?? data ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });
};

export const useDeals = () => {
  return useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/deals');
      return data?.data ?? data ?? [];
    }
  });
};

export const useAddDeal = () => useOptimisticMutation(['deals'], 'post', '/crm/deals');

export const useContacts = () => {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/contacts');
      return data?.data ?? data ?? [];
    }
  });
};

export const useAddContact = () => useOptimisticMutation(['contacts'], 'post', '/crm/contacts');

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/customers');
      return data.data || data;
    }
  });
};

export const useForecast = () => {
  return useQuery({
    queryKey: ['forecast'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/forecast');
      return data.data || data;
    }
  });
};

export const useOpportunities = () => {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/opportunities');
      return data.data || data;
    }
  });
};

export const useActivities = () => {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/activities');
      return data.data || data;
    }
  });
};
