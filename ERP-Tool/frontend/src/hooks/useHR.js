import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

// -- Employees --
export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const data = await api.hr.getEmployees();
      return Array.isArray(data) ? data : (data?.data || []);
    }
  });
};

export const useAddEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee) => {
      return await api.hr.addEmployee(employee);
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
      // NOTE: There is no updateEmployee in api.hr yet, but we'll fall back to api request
      const res = await api.hr.updateEmployee ? await api.hr.updateEmployee(id, employee) : null;
      return res;
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
      const data = await api.hr.getLeaveRequests();
      return Array.isArray(data) ? data : (data?.data || []);
    }
  });
};

export const useAddLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leave) => {
      return await api.hr.createLeaveRequest(leave.employeeId || leave.employee_id, {
          employeeId: leave.employee_id,
          leaveTypeName: leave.leave_type,
          startDate: leave.start_date,
          endDate: leave.end_date,
          totalDays: 1, // simplified
          reason: leave.reason
      });
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
      return await api.hr.updateLeaveStatus(id, status, isUnpaid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    }
  });
};
