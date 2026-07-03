import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useExportExcel = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/export/excel', data, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export-${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  });
};
