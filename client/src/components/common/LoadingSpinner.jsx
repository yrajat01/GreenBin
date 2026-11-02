import React from 'react';

export const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size] || 'w-8 h-8 border-3';

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses} border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin`} />
      {text && <span className="text-sm font-medium text-slate-400 animate-pulse">{text}</span>}
    </div>
  );
};

export const FullPageLoader = ({ text = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

export default LoadingSpinner;

