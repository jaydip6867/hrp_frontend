import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ems_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  // Admin Login
  const adminLogin = async (identifier, password) => {
    const res = await api.post('/auth/admin/login', { identifier, password });
    if (res.success && res.token) {
      localStorage.setItem('ems_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Admin login failed');
  };

  // Employee Login (Username + Password)
  const employeeLogin = async (username, password) => {
    const res = await api.post('/auth/employee/login', { username, password });
    if (res.success && res.token) {
      localStorage.setItem('ems_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Employee login failed');
  };

  // Employee Registration
  const employeeRegister = async (formData) => {
    const res = await api.post('/auth/employee/register', formData);
    return res;
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      console.error('Failed to refresh user session:', err);
    }
  };

  const updateUser = (updatedFields) => {
    setUser(prev => prev ? ({ ...prev, ...updatedFields }) : prev);
  };

  const logout = () => {
    localStorage.removeItem('ems_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      adminLogin,
      employeeLogin,
      employeeRegister,
      refreshUser,
      updateUser,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
