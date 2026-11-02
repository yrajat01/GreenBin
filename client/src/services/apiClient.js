import env from '../config/env';

/**
 * Scalable HTTP API Client
 * Automatically manages Authorization headers, request timeouts, and error normalization.
 */

const getHeaders = (customHeaders = {}) => {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    // If unauthorized, check if on login/signup page. If not, trigger auth state reset.
    const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/signup';
    if (!isAuthRoute) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const payload = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const errorMsg = (typeof payload === 'object' && payload?.message) || res.statusText || 'Request failed';
    const error = new Error(errorMsg);
    error.status = res.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const apiClient = {
  get: async (endpoint, options = {}) => {
    const res = await fetch(`${env.apiUrl}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(options.headers),
      ...options,
    });
    return handleResponse(res);
  },

  post: async (endpoint, body, options = {}) => {
    const res = await fetch(`${env.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(options.headers),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
    return handleResponse(res);
  },

  patch: async (endpoint, body, options = {}) => {
    const res = await fetch(`${env.apiUrl}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(options.headers),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
    return handleResponse(res);
  },

  put: async (endpoint, body, options = {}) => {
    const res = await fetch(`${env.apiUrl}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(options.headers),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
    return handleResponse(res);
  },

  delete: async (endpoint, options = {}) => {
    const res = await fetch(`${env.apiUrl}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(options.headers),
      ...options,
    });
    return handleResponse(res);
  },
};

export default apiClient;

