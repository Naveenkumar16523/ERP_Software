import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useERPStore } from '../store/useERPStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        if ([401, 403, 404].includes(error?.response?.status)) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error) => {
        const msg = error?.response?.data?.detail ?? error?.message ?? 'Request failed';
        useERPStore.getState().addToast(msg, 'error');
      },
    },
  },
});

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
