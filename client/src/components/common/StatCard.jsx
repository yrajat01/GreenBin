import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  onClick,
  className = '',
}) => {
  const isClickable = typeof onClick === 'function';

  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:border-slate-700 hover:bg-slate-800/80 hover:scale-[1.01]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/50 flex items-center justify-center text-emerald-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-3xl font-extrabold text-white tracking-tight">{value}</div>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md ${
              trendPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
    </div>
  );
};

export default StatCard;

