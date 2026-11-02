import { useState, useCallback, useEffect } from 'react';
import reportService from '../services/reportService';
import { useSocketEvent } from './useSocket';

export const useReports = ({ autoFetch = true, scope = 'my' } = {}) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = scope === 'all'
        ? await reportService.getAll()
        : await reportService.getMyReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError(err.message || 'Unable to load reports');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  // Listen to new reports submitted in real-time
  useSocketEvent('new_report', useCallback(({ report }) => {
    if (report) {
      setReports((prev) => [report, ...prev]);
    }
  }, []));

  useEffect(() => {
    if (autoFetch) {
      fetchReports();
    }
  }, [autoFetch, fetchReports]);

  const submitReport = async (reportData) => {
    setSubmitting(true);
    try {
      const res = await reportService.submit(reportData);
      if (res && res.report) {
        setReports((prev) => [res.report, ...prev]);
      }
      return res;
    } finally {
      setSubmitting(false);
    }
  };

  const updateReportStatus = async (reportId, status, notes) => {
    const res = await reportService.updateStatus(reportId, { status, notes });
    setReports((prev) =>
      prev.map((r) => (r.reportId === reportId ? { ...r, status, notes, resolvedAt: new Date().toISOString() } : r))
    );
    return res;
  };

  return {
    reports,
    loading,
    error,
    submitting,
    fetchReports,
    submitReport,
    updateReportStatus,
  };
};

export default useReports;

