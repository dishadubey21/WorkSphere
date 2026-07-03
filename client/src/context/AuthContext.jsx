import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client.js';
import { queryClient } from '../api/queryClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth session on page load/refresh
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        if (res.success && res.user) {
          setUser(res.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    verifySession();
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  // Registration handler
  const registerUser = async (data) => {
    try {
      const res = await apiClient.post('/auth/register', data);
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      setUser(null);
      queryClient.clear();
    }
  };

  // Refresh User state dynamically
  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      console.error('Refresh user failed', err);
    }
  };

  // Role verification helper
  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        register: registerUser,
        logout,
        refreshUser,
        hasRole
      }}
    >
      {children}
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
