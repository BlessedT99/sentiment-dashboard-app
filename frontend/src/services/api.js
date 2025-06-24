import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const sentimentAPI = {
  analyze: (text) => api.post('/sentiment/analyze', { text }),
  getHistory: (limit = 50, filter = 'all') => 
    api.get(`/sentiment/history?limit=${limit}&filter=${filter}`),
  deleteAnalysis: (id) => api.delete(`/sentiment/history/${id}`),
  getStats: () => api.get('/sentiment/stats'),
};

export default api;