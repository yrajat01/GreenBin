import React from 'react';
import { STATUS_CONFIG, REPORT_STATUS_CONFIG } from '../../constants/binStatus';

export const StatusBadge = ({ status, type = 'bin', className = '' }) => {
  if (type === 'report') {
    const config = REPORT_STATUS_CONFIG[status] || {
      label: status || 'Unknown',
      badgeClass: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${config.badgeClass} ${className}`}>
        {config.label}
      </span>
    );
  }

  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    badgeClass: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    dotClass: 'bg-slate-400 ring-slate-400/20',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${config.badgeClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ring-2 ${config.dotClass}`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;

