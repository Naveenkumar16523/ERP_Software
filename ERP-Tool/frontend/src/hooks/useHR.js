import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

// -- Employees --
export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await apiClient.get('/hr/employees');
      return Array.isArray(data) ? data : (data?.data || []);
    }
  });
};

export const useAddEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee) => {
      const { data } = await apiClient.post('/hr/employees', employee);
      return data;
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
      return data;
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
      return Array.isArray(data) ? data : (data?.data || []);
    }
  });
};

export const useAddLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leave) => {
      const { data } = await apiClient.post('/hr/leaves', {
          employeeId: leave.employee_id || leave.employeeId,
          leaveTypeName: leave.leave_type,
          startDate: leave.start_date,
          endDate: leave.end_date,
          totalDays: 1, // simplified
          reason: leave.reason
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    }
  });
};

export const useUpdateLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, isUnpaid }) => {
      const { data } = await apiClient.patch(`/hr/leaves/${id}/status`, { status, isUnpaid });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    }
  });
};
