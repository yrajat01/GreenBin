import apiClient from './apiClient';

/**
 * Service for Smart Bins API
 */
export const binService = {
  getAll: () => apiClient.get('/api/bins'),
  getById: (binId) => apiClient.get(`/api/bins/${binId}`),
  collect: (binId) => apiClient.patch(`/api/bins/${binId}/collect`, {}),
};

export default binService;

