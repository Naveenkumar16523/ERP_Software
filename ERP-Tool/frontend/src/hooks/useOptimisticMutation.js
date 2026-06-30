import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useOptimisticMutation = (queryKey, method = 'post', endpoint) => {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (payload) => {
      const url = typeof endpoint === 'function' ? endpoint(payload) : endpoint;
      if (method === 'delete') {
        return apiClient.delete(url, { data: payload }).then(r => r.data);
      }
      return apiClient[method](url, payload).then(r => r.data);
    },
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey });
      const snapshot = qc.getQueryData(queryKey);
      
      qc.setQueryData(queryKey, (old) => {
        // If there's no old data, just return, don't try to mock the whole list
        if (!old && method !== 'post') return old;
        
        const list = Array.isArray(old) ? old : (old?.data || []);
        let updated;
        
        if (method === 'post') {
          updated = [...list, { ...variables, id: variables.id || `temp-${Date.now()}`, _optimistic: true }];
        } else if (method === 'patch' || method === 'put') {
          // Identify the item by id. If no id is in variables, this generic logic might fail.
          updated = list.map(item => item.id === variables.id ? { ...item, ...variables, _optimistic: true } : item);
        } else if (method === 'delete') {
          // Support variables being just the id string/number, or an object with an id
          const targetId = typeof variables === 'object' ? variables.id : variables;
          updated = list.filter(item => item.id !== targetId);
        } else {
          updated = list;
        }
        
        return Array.isArray(old) ? updated : { ...old, data: updated };
      });
      
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(queryKey, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });
};
