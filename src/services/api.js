// Robust API client that works in all network environments
function getBaseUrl() {
  if (typeof window === 'undefined') return 'http://localhost:5050/api/v1';
  // If browser is running in development mode on Vite (5173, 5174, 5175, etc.) or port 3000
  if (['5173', '5174', '5175', '3000'].includes(window.location.port)) {
    return `${window.location.protocol}//${window.location.hostname}:5050/api/v1`;
  }
  // Otherwise use relative path (e.g. unified production server on port 5050)
  return '/api/v1';
}

class ApiClient {
  constructor() {}

  getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('ems_token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    const headers = this.getHeaders(options.isFormData);

    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    };

    if (options.body && !options.isFormData && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `Request failed (${response.status})`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Could not connect to backend. Please ensure the backend server is running on http://localhost:5050.');
      }
      throw err;
    }
  }

  get(endpoint, params = {}) {
    const cleanParams = {};
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          cleanParams[k] = params[k];
        }
      });
    }
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body, isFormData = false) {
    return this.request(endpoint, { method: 'POST', body, isFormData });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient();
export default api;
