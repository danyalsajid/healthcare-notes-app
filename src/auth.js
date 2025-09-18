import { createSignal, createEffect } from 'solid-js';

// API base URL
const API_BASE = 'http://localhost:3001/api';

// Authentication state
const [isAuthenticated, setIsAuthenticated] = createSignal(false);
const [user, setUser] = createSignal(null);
const [token, setToken] = createSignal(null);
const [authLoading, setAuthLoading] = createSignal(false);
const [authError, setAuthError] = createSignal(null);

// Initialize auth state from localStorage
const initAuth = () => {
  const storedToken = localStorage.getItem('healthcare_token');
  const storedUser = localStorage.getItem('healthcare_user');
  
  if (storedToken && storedUser) {
    try {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      localStorage.removeItem('healthcare_token');
      localStorage.removeItem('healthcare_user');
    }
  }
};

// API helper with auth
const authApiCall = async (endpoint, options = {}) => {
  const currentToken = token();
  
  // Don't make API calls if not authenticated (except for login)
  if (!currentToken && !endpoint.includes('/auth/login')) {
    throw new Error('Not authenticated');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (currentToken) {
    headers.Authorization = `Bearer ${currentToken}`;
  }
  
  try {
    setAuthError(null);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    
    if (response.status === 401) {
      // Token expired or invalid
      logout();
      throw new Error('Authentication required');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    // Only set auth error if it's not a network/CORS error
    if (!err.message.includes('fetch')) {
      setAuthError(err.message);
    }
    throw err;
  }
};

// Login function
const login = async (username, password) => {
  try {
    setAuthLoading(true);
    setAuthError(null);
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }
    
    const data = await response.json();
    
    // Store auth data
    localStorage.setItem('healthcare_token', data.token);
    localStorage.setItem('healthcare_user', JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    
    return data;
  } catch (error) {
    setAuthError(error.message);
    throw error;
  } finally {
    setAuthLoading(false);
  }
};

// Signup function
const signup = async (userData) => {
  try {
    setAuthLoading(true);
    setAuthError(null);
    
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Signup failed');
    }
    
    const data = await response.json();
    
    // Store auth data (user is automatically logged in after signup)
    localStorage.setItem('healthcare_token', data.token);
    localStorage.setItem('healthcare_user', JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    
    return data;
  } catch (error) {
    setAuthError(error.message);
    throw error;
  } finally {
    setAuthLoading(false);
  }
};

// Logout function
const logout = async () => {
  try {
    // Call logout endpoint if token exists
    if (token()) {
      await authApiCall('/auth/logout', { method: 'POST' });
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Clear local state regardless of API call result
    localStorage.removeItem('healthcare_token');
    localStorage.removeItem('healthcare_user');
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  }
};

// Get current user info
const getCurrentUser = async () => {
  try {
    const userData = await authApiCall('/auth/me');
    setUser(userData);
    return userData;
  } catch (error) {
    console.error('Failed to get current user:', error);
    throw error;
  }
};

// Initialize auth on app start
initAuth();

// Export auth functions and state
export {
  isAuthenticated,
  user,
  token,
  authLoading,
  authError,
  login,
  signup,
  logout,
  getCurrentUser,
  authApiCall
};
