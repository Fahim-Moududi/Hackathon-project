import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [baby, setBaby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate?.(); // Safely access useNavigate

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        const [storedUser, storedBaby] = await Promise.all([
          authService.getCurrentUser(),
          authService.getCurrentBaby()
        ]);
        
        console.log('Stored user:', storedUser);
        console.log('Stored baby:', storedBaby);
        
        // Only set user and baby if both are valid
        if (storedUser && storedBaby) {
          setUser(storedUser);
          setBaby(storedBaby);
        } else {
          console.warn('Incomplete auth data in storage. Require both user and baby.');
          // Clear any partial auth data
          authService.logout();
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        // Clear any potentially corrupted auth data
        authService.logout();
        setError('Failed to load user session. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Register new user with baby
  const register = async (userData) => {
    try {
      setError(null);
      const { user: newUser, baby: newBaby } = await authService.register(userData);
      setUser(newUser);
      setBaby(newBaby);
      return { user: newUser, baby: newBaby };
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      setError(null);
      const { user: loggedInUser, baby: userBaby } = await authService.login(credentials);
      setUser(loggedInUser);
      setBaby(userBaby);
      return { user: loggedInUser, baby: userBaby };
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    authService.logout();
    setUser(null);
    setBaby(null);
    // Only navigate if we have access to the navigate function
    if (navigate) {
      navigate('/login');
    } else {
      // Fallback to window.location if navigate is not available
      window.location.href = '/login';
    }
  };

  // Update baby information
  const updateBaby = (updatedBaby) => {
    setBaby(updatedBaby);
    localStorage.setItem('baby', JSON.stringify(updatedBaby));
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return authService.isAuthenticated();
  };

  // Get auth header for API requests
  const getAuthHeader = () => {
    return authService.getAuthHeader();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        baby,
        loading,
        error,
        register,
        login,
        logout,
        updateBaby,
        isAuthenticated,
        getAuthHeader,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
