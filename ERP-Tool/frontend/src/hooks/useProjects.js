import { useOptimisticCreate } from './useOptimisticCreate';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';




export const useProjects = (filters) =>
  useQuery({
    queryKey: ['projects', 'projects', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/projects/projects', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateProject = () => useOptimisticCreate(['projects', 'projects'], '/projects/projects');

export const useTasks = (filters) =>
  useQuery({
    queryKey: ['projects', 'tasks', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/projects/tasks', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateTask = () => useOptimisticCreate(['projects', 'tasks'], '/projects/tasks');

export const useMilestones = (filters) =>
  useQuery({
    queryKey: ['projects', 'milestones', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/projects/milestones', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateMilestone = () => useOptimisticCreate(['projects', 'milestones'], '/projects/milestones');

export const useResourceAllocations = (filters) =>
  useQuery({
    queryKey: ['projects', 'resourceAllocations', filters],
    queryFn: async () => {
      const { data } = await apiClient.get('/projects/resources', { params: filters });
      return data?.data ?? data ?? [];
    },
    staleTime: 60_000,
  });

export const useCreateResourceAllocation = () => useOptimisticCreate(['projects', 'resourceAllocations'], '/projects/resources');
