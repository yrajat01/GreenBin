import apiClient from './apiClient';

/**
 * Service for User Authentication & Profile
 */
export const authService = {
  login: (credentials) => apiClient.post('/api/users/login', credentials),
  signup: (userData) => apiClient.post('/api/users/signup', userData),
  getMe: () => apiClient.get('/api/users/me'),
};

export default authService;

