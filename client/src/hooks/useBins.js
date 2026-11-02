import { useState, useEffect, useCallback, useMemo } from 'react';
import binService from '../services/binService';
import { useSocketEvent } from './useSocket';

export const useBins = () => {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBin, setSelectedBin] = useState(null);

  const fetchBins = useCallback(async () => {
    try {
      setError(null);
      const data = await binService.getAll();
      setBins(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch bins:', err);
      setError(err.message || 'Unable to load smart bins');
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for real-time bin status changes
  useSocketEvent('bin_update', useCallback((updatedBin) => {
    setBins((prev) => prev.map((b) => (b.binId === updatedBin.binId ? updatedBin : b)));
    setSelectedBin((prev) => (prev && prev.binId === updatedBin.binId ? updatedBin : prev));
  }, []));

  // Listen for bin collection events
  useSocketEvent('bin_collected', useCallback(({ binId }) => {
    setBins((prev) =>
      prev.map((b) =>
        b.binId === binId ? { ...b, fillLevel: 5, status: 'normal', lastCollected: new Date().toISOString() } : b
      )
    );
  }, []));

  useEffect(() => {
    fetchBins();
  }, [fetchBins]);

  const collectBin = async (binId) => {
    try {
      const res = await binService.collect(binId);
      // Optimistic local update
      setBins((prev) =>
        prev.map((b) =>
          b.binId === binId ? { ...b, fillLevel: 5, status: 'normal', lastCollected: new Date().toISOString() } : b
        )
      );
      return res;
    } catch (err) {
      throw err;
    }
  };

  // Memoized metrics & aggregations
  const stats = useMemo(() => {
    const total = bins.length;
    const critical = bins.filter((b) => b.status === 'critical').length;
    const smell = bins.filter((b) => b.status === 'smell_reported').length;
    const warning = bins.filter((b) => b.status === 'warning').length;
    const normal = bins.filter((b) => b.status === 'normal').length;
    const avgFill = total > 0 ? Math.round(bins.reduce((acc, b) => acc + (b.fillLevel || 0), 0) / total) : 0;

    return {
      total,
      critical,
      smell,
      warning,
      normal,
      avgFill,
    };
  }, [bins]);

  return {
    bins,
    setBins,
    loading,
    error,
    selectedBin,
    setSelectedBin,
    fetchBins,
    collectBin,
    stats,
  };
};

export default useBins;

