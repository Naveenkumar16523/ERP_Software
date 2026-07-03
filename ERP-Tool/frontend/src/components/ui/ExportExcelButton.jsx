import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useExportExcel } from '../../hooks/useExport';
import { useERPStore } from '../../store/useERPStore';

export default function ExportExcelButton({ data, disabled, className }) {
  const { mutateAsync: exportExcel, isPending } = useExportExcel();
  const { addToast } = useERPStore();

  const handleExport = async () => {
    if (!data || data.length === 0) {
      addToast('No data to export', 'error');
      return;
    }
    try {
      await exportExcel(data);
      addToast('Export downloaded successfully', 'success');
    } catch (err) {
      addToast('Failed to export Excel', 'error');
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isPending}
      className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all
        bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 disabled:opacity-50 ${className || ''}`}
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      Export to Excel
    </button>
  );
}
