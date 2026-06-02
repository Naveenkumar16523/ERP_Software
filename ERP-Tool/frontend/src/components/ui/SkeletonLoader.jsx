import React from 'react';
import { motion } from 'framer-motion';

export default function SkeletonLoader({ variant = 'card', lines = 3 }) {
  const pulse = {
    animate: { opacity: [0.4, 0.7, 0.4] },
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
  };

  if (variant === 'card') {
    return (
      <motion.div {...pulse} className="theme-card rounded-xl p-5 space-y-4">
        <div className="h-4 bg-surface rounded-lg w-1/3 border border-main/30" />
        <div className="h-8 bg-surface rounded-lg w-1/2 border border-main/30" />
        <div className="h-2 bg-surface rounded-full w-full" />
      </motion.div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="theme-card rounded-xl overflow-hidden">
        {[...Array(lines)].map((_, i) => (
          <motion.div key={i} {...pulse} className="flex items-center gap-4 px-5 py-3 border-b border-main last:border-0">
            <div className="w-8 h-8 rounded-full bg-surface flex-shrink-0 border border-main/30" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-surface rounded border border-main/20 w-1/3" />
              <div className="h-2 bg-surface rounded w-1/2" />
            </div>
            <div className="h-4 bg-surface rounded border border-main/20 w-16" />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div {...pulse} className="h-4 bg-surface rounded-lg w-full border border-main/20" />
  );
}
