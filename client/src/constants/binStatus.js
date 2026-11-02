/**
 * Bin and Report Status Definitions with consistent UI styles
 */

export const BIN_STATUS = Object.freeze({
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical',
  SMELL_REPORTED: 'smell_reported',
});

export const STATUS_CONFIG = Object.freeze({
  [BIN_STATUS.NORMAL]: {
    label: 'Normal',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    indicatorClass: 'bg-emerald-500',
    dotClass: 'bg-emerald-500 ring-emerald-500/20',
  },
  [BIN_STATUS.WARNING]: {
    label: 'Warning',
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    indicatorClass: 'bg-amber-500',
    dotClass: 'bg-amber-500 ring-amber-500/20',
  },
  [BIN_STATUS.CRITICAL]: {
    label: 'Critical',
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    indicatorClass: 'bg-rose-500',
    dotClass: 'bg-rose-500 ring-rose-500/20',
  },
  [BIN_STATUS.SMELL_REPORTED]: {
    label: 'Smell Reported',
    color: 'purple',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
    indicatorClass: 'bg-purple-500',
    dotClass: 'bg-purple-500 ring-purple-500/20',
  },
});

export const REPORT_STATUS_CONFIG = Object.freeze({
  pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
  resolved: {
    label: 'Resolved',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  },
  dismissed: {
    label: 'Dismissed',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
  },
});

