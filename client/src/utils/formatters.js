/**
 * Formatting Utilities
 */

export const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDistance = (km) => {
  if (km === undefined || km === null) return '0.0 km';
  return `${Number(km).toFixed(1)} km`;
};

export const formatPercent = (val) => {
  if (val === undefined || val === null) return '0%';
  return `${Math.round(val)}%`;
};

