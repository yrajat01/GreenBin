import apiClient from './apiClient';

/**
 * Service for Collection Route Optimization & Dispatch
 */
export const routeService = {
  generate: () => apiClient.get('/api/route/generate'),
  getCurrent: () => apiClient.get('/api/route/current'),
};

export default routeService;

