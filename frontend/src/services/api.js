import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Growth Records API
export const growthApi = {
  // Create a new growth record
  create: async (data) => {
    try {
      const response = await api.post('/growth/', data);
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Failed to create growth record' 
      };
    }
  },

  // Get all growth records
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/growth/records/', { params });
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Failed to fetch growth records' 
      };
    }
  },

  // Get a single growth record by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/growth/records/${id}/`);
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Failed to fetch growth record' 
      };
    }
  },

  // Get growth prediction without saving
  predict: async (data) => {
    try {
      const response = await api.post('/growth/predict/', data);
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Failed to get growth prediction' 
      };
    }
  },

  // Predict next month's growth
  predictNextMonth: async (data) => {
    try {
      const response = await api.post('/growth/predict-next-month/', data);
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Failed to predict next month\'s growth' 
      };
    }
  },
};

// Baby Profiles API
export const babyApi = {
  // Get all babies for current user
  getAll: async () => {
    try {
      const response = await api.get('/babies/');
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Failed to fetch babies' 
      };
    }
  },

  // Create a new baby profile
  create: async (data) => {
    try {
      const response = await api.post('/babies/', data);
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Failed to create baby profile' 
      };
    }
  },

  // Get a baby by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/babies/${id}/`);
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Failed to fetch baby profile' 
      };
    }
  },

  // Update a baby profile
  update: async (id, data) => {
    try {
      const response = await api.patch(`/babies/${id}/`, data);
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Failed to update baby profile' 
      };
    }
  },

  // Delete a baby profile
  delete: async (id) => {
    try {
      await api.delete(`/babies/${id}/`);
      return { error: null };
    } catch (error) {
      return { 
        error: error.response?.data?.message || 'Failed to delete baby profile' 
      };
    }
  },
};

// Auth API
export const authApi = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login/', credentials);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('authToken');
    return { data: { success: true }, error: null };
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/user/');
      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error.response?.data?.message || 'Failed to fetch user data' 
      };
    }
  },
};

export default api;
