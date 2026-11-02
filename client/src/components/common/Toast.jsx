import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const { message, type = 'success' } = toast;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      style: 'bg-emerald-950/90 border-emerald-800/80 text-emerald-200 shadow-emerald-950/50',
      iconStyle: 'text-emerald-400',
    },
    error: {
      icon: AlertCircle,
      style: 'bg-rose-950/90 border-rose-800/80 text-rose-200 shadow-rose-950/50',
      iconStyle: 'text-rose-400',
    },
    info: {
      icon: Info,
      style: 'bg-cyan-950/90 border-cyan-800/80 text-cyan-200 shadow-cyan-950/50',
      iconStyle: 'text-cyan-400',
    },
  }[type] || {
    icon: Info,
    style: 'bg-slate-900 border-slate-700 text-slate-200',
    iconStyle: 'text-slate-400',
  };

  const Icon = typeConfig.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md ${typeConfig.style}`}>
        <Icon className={`w-5 h-5 flex-shrink-0 ${typeConfig.iconStyle}`} />
        <span className="text-sm font-medium">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;

