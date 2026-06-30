import { QueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function prefetchModuleData(qc: QueryClient, moduleId: string) {
  switch (moduleId) {
    case 'finance':
      qc.prefetchQuery({ queryKey: ['finance', 'accounts'], queryFn: () => apiClient.get('/finance/accounts').then(r => r.data) });
      qc.prefetchQuery({ queryKey: ['finance', 'invoices'], queryFn: () => apiClient.get('/finance/invoices').then(r => r.data) });
      break;
    case 'hr':
      qc.prefetchQuery({ queryKey: ['hr', 'employees'], queryFn: () => apiClient.get('/hr/employees').then(r => r.data?.data ?? []) });
      break;
    case 'procurement':
      qc.prefetchQuery({ queryKey: ['procurement', 'suppliers'], queryFn: () => apiClient.get('/procurement/suppliers').then(r => r.data?.data ?? []) });
      break;
    case 'inventory':
      qc.prefetchQuery({ queryKey: ['inventory', 'products'], queryFn: () => apiClient.get('/inventory/products').then(r => r.data?.data ?? []) });
      break;
    // other modules can be added here
  }
}
