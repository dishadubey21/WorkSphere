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
    let logoutUrl = null;
    try {
      const res = await apiClient.post('/auth/logout');
      if (res && res.success && res.logoutUrl) {
        logoutUrl = res.logoutUrl;
      }
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      setUser(null);
      queryClient.clear();

      // Clear transient OIDC storage (sessionStorage and localStorage PKCE verifiers/states)
      sessionStorage.removeItem('ping_auth_state');
      sessionStorage.removeItem('ping_auth_verifier');

      // Sweep storage to completely clear any other OIDC/PKCE keys
      for (const storage of [localStorage, sessionStorage]) {
        const keysToRemove = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && (key.includes('ping_auth') || key.includes('oidc') || key.includes('pkce') || key.includes('verifier') || key.includes('state'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => storage.removeItem(key));
      }

      if (logoutUrl) {
        window.location.href = logoutUrl;
      } else {
        window.location.href = '/login';
      }
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
