import apiClient from './apiClient';

/**
 * Service for Issue Reports & Citizen Feedback
 */
export const reportService = {
  submit: (reportData) => apiClient.post('/api/reports', reportData),
  getMyReports: () => apiClient.get('/api/reports/my'),
  getAll: () => apiClient.get('/api/reports'),
  updateStatus: (reportId, data) => apiClient.patch(`/api/reports/${reportId}`, data),
};

export default reportService;

