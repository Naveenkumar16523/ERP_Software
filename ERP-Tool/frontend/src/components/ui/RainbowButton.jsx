import React from 'react';

export const RainbowButton = React.forwardRef(({ children, className = '', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`rainbow-btn-effect group relative inline-flex h-10 cursor-pointer items-center justify-center rounded-full px-6 py-2 text-xs font-semibold text-slate-200 dark:text-slate-100 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

RainbowButton.displayName = 'RainbowButton';
