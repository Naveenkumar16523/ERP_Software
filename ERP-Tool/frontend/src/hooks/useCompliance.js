import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../api/client';

export const useCompliance = () => {
  const queryClient = useQueryClient();

  const getEwayBills = useQuery({
    queryKey: ['ewaybills'],
    queryFn: async () => {
      const { data } = await api.get('/compliance/ewaybills');
      return data;
    }
  });

  const createEwayBill = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/compliance/ewaybills', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ewaybills'] });
    }
  });

  const downloadEwayBillPdf = async (id) => {
    try {
      const response = await api.get(`/compliance/ewaybills/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `EwayBill_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download E-Way Bill PDF:', error);
      alert('Failed to download E-Way Bill PDF.');
    }
  };

  return {
    getEwayBills,
    createEwayBill,
    downloadEwayBillPdf
  };
};
