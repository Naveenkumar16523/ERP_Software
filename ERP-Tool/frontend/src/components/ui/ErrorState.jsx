import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="w-10 h-10 text-rose-400" />
      <p className="text-sm text-muted font-medium">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="px-4 py-2 bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-300 border border-rose-500/30 rounded-xl hover:bg-rose-500/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-300 text-sm font-semibold"
        >
          Retry
        </button>
      )}
    </div>
  );
}
