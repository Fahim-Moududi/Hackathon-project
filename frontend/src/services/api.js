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

// Growth Records API
export const growthApi = {
  // Helper function to calculate z-scores
  calculateZScores: async (ageMonths, gender, weightKg, heightCm) => {
    console.log('Calculating z-scores for:', { ageMonths, gender, weightKg, heightCm });
    
    try {
      // Call the backend API to calculate z-scores
      const response = await api.post('/growth/calculate-zscores/', {
        age_months: ageMonths,
        gender: gender,
        weight_kg: weightKg,
        height_cm: heightCm
      });
      
      console.log('Z-scores from backend:', response.data);
      return {
        z_score_weight: response.data.z_score_weight,
        z_score_height: response.data.z_score_height
      };
    } catch (error) {
      console.error('Error calculating z-scores:', error);
      // Return null values if there's an error
      return {
        z_score_weight: null,
        z_score_height: null
      };
    }
  },
  
  // Create a new growth record
  create: async (data) => {
    try {
      console.log('Sending request to /growth/ with data:', data);
      
      // Calculate z-scores if we have the required data
      let zScores = { z_score_weight: null, z_score_height: null };
      if (data.age_months && data.gender && data.weight_kg && data.height_cm) {
        try {
          zScores = growthApi.calculateZScores(
            data.age_months,
            data.gender,
            data.weight_kg,
            data.height_cm
          );
          console.log('Calculated z-scores:', zScores);
        } catch (zScoreError) {
          console.error('Error calculating z-scores:', zScoreError);
          // Continue without z-scores - backend will calculate them
        }
      }
      
      // Ensure we're not sending undefined or null values for required fields
      const payload = {
        ...data,
        // Convert empty strings to null for optional fields
        baby_id: data.baby_id || null,
        weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
        height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
        // Include z-scores in the payload
        ...zScores
      };
      
      console.log('Final payload with z-scores:', payload);
      
      const response = await api.post('/growth/', payload);
      console.log('Response from /growth/:', response);
      
      return { data: response.data, error: null };
    } catch (error) {
      console.error('Error in growthApi.create:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
      
      let errorMessage = 'Failed to create growth record';
      
      if (error.response) {
        // Handle 400 Bad Request with field-specific errors
        if (error.response.status === 400 && error.response.data) {
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
            .join('; ');
          errorMessage = fieldErrors || JSON.stringify(error.response.data);
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      return { 
        data: null, 
        error: errorMessage
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
      console.log('Making request to /babies/ endpoint');
      const token = localStorage.getItem('access_token');
      console.log('Using token:', token ? `${token.substring(0, 10)}...` : 'No token found');
      
      const response = await api.get('/babies/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response from /babies/:', response);
      return { data: response.data, error: null };
    } catch (error) {
      console.error('Error in babyApi.getAll:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      return { 
        data: null, 
        error: error.response?.data?.message || error.message || 'Failed to fetch babies' 
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
