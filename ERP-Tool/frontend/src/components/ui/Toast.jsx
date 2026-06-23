import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useERPStore } from '../../store/useERPStore';

const TOAST_ICONS = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  error: <AlertCircle className="w-5 h-5 text-rose-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  info: <Info className="w-5 h-5 text-sky-400" />
};

const TOAST_STYLES = {
  success: 'border-emerald-500/30 bg-emerald-950/80',
  error: 'border-rose-500/30 bg-rose-950/80',
  warning: 'border-amber-500/30 bg-amber-950/80',
  info: 'border-sky-500/30 bg-sky-950/80'
};

export default function ToastContainer() {
  const { toasts, removeToast } = useERPStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const styleClass = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, scale: 0.9, filter: 'blur(4px)' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex items-start gap-3 max-w-sm w-full px-4 py-3 rounded-xl border backdrop-blur-xl shadow-xl ${styleClass}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {TOAST_ICONS[toast.type] || TOAST_ICONS.info}
      </div>
      <div className="flex-1 text-sm font-medium leading-5 text-white">
        {toast.message}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-white/40 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}