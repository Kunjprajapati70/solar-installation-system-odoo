import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sunpower_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Check if network error or server down
    if (!error.response) {
      console.error('Network Error / Backend Offline:', error.message);
      const networkErr = new Error('Network Connection Error: Server is unavailable. Please check backend connection.');
      networkErr.status = 503;
      networkErr.isNetworkError = true;
      return Promise.reject(networkErr);
    }

    const { status, data } = error.response;
    const message = data?.message || error.message || 'An unexpected error occurred.';

    // If token is invalid or expired (401), clear local session
    if (status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('sunpower_token');
        localStorage.removeItem('sunpower_user');
        // Do not force immediate harsh reload if already handling gracefully
      }
    }

    const apiError = new Error(message);
    apiError.status = status;
    apiError.data = data;
    return Promise.reject(apiError);
  }
);

export default api;
