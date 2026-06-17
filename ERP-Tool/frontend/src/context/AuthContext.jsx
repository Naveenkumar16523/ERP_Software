import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const { data } = await apiClient.get('/auth/me');
          setUser(data.user || data);
          // If the endpoint returns permissions separately
          setPermissions(data.permissions || []);
        } catch (error) {
          console.error("Auth init failed:", error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    setUser(data.user);
    setPermissions(data.permissions || []);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setPermissions([]);
    window.location.href = '/login';
  };

  const hasPermission = (requiredPermission) => {
    if (!user) return false;
    if (user.isCEO) return true; // CEO has all permissions
    return permissions.some(p => p.permission === requiredPermission);
  };

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout, hasPermission }}>
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
