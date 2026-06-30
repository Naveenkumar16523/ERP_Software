import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useOptimisticCreate = (queryKey, endpoint) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post(endpoint, payload).then((r) => r.data),
    onMutate: async (newItem) => {
      await qc.cancelQueries({ queryKey });
      const snapshot = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old) => {
        if (!old) return [{ ...newItem, id: `temp-${Date.now()}`, _optimistic: true }];
        const list = Array.isArray(old) ? old : (old.data || []);
        const updated = [...list, { ...newItem, id: `temp-${Date.now()}`, _optimistic: true }];
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
