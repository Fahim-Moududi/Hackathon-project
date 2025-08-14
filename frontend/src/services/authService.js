import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token available, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken
        });
        
        const { access } = response.data;
        
        // Update tokens in storage
        localStorage.setItem('access_token', access);
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear storage and redirect to login
        authService.logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

const authService = {
  // Register new user with baby information
  register: async (userData) => {
    try {
      const response = await api.post('/auth/signup/', {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        baby_name: userData.babyName,
        baby_gender: userData.gender,
        baby_birth_date: userData.birthDate
      });
      
      // Store tokens and user data
      const { tokens, user, baby } = response.data;
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('baby', JSON.stringify(baby));
      
      return { user, baby };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login/', credentials);
      const { tokens, user, baby } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('baby', JSON.stringify(baby));
      
      return { user, baby };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('baby');
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      if (!user) return null;
      return typeof user === 'string' ? JSON.parse(user) : user;
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user'); // Clear invalid data
      return null;
    }
  },

  // Get current baby
  getCurrentBaby: () => {
    try {
      const baby = localStorage.getItem('baby');
      if (!baby) return null;
      return typeof baby === 'string' ? JSON.parse(baby) : baby;
    } catch (error) {
      console.error('Error parsing baby data:', error);
      localStorage.removeItem('baby'); // Clear invalid data
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Get auth header
  getAuthHeader: () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

export default authService;
