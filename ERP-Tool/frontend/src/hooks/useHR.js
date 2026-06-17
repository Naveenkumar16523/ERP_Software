import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

// -- Employees --
export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await apiClient.get('/hr/employees');
      return data.data; // Because response is {"data": [...], "meta": {...}}
    }
  });
};

export const useAddEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee) => {
      const { data } = await apiClient.post('/hr/employees', employee);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...employee }) => {
      const { data } = await apiClient.put(`/hr/employees/${id}`, employee);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
};

// -- Leaves --
export const useLeaves = () => {
  return useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const { data } = await apiClient.get('/hr/leaves');
      return data.data;
    }
  });
};

export const useAddLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leave) => {
      const { data } = await apiClient.post('/hr/leaves', leave);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    }
  });
};

export const useUpdateLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...leave }) => {
      const { data } = await apiClient.put(`/hr/leaves/${id}`, leave);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    }
  });
};
