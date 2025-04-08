import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar si hay un token guardado
    const token = localStorage.getItem('token');
    if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (token) => {
    try {
      const config = {
        headers: {
          'x-auth-token': token
        }
      };

      const res = await axios.get('/api/auth/user', config);
      setCurrentUser(res.data.user);
      setLoading(false);
    } catch (err) {
      localStorage.removeItem('token');
      setCurrentUser(null);
      setLoading(false);
    }
  };

  const register = async (username, password) => {
    try {
      setError('');
      const res = await axios.post('/api/auth/register', { username, password });
      localStorage.setItem('token', res.data.token);
      setCurrentUser(res.data.user);
      return res.data.user;
    } catch (err) {
      setError(err.response?.data?.message || 'Error en el registro');
      throw err;
    }
  };

  const login = async (username, password) => {
    try {
      setError('');
      const res = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      setCurrentUser(res.data.user);
      return res.data.user;
    } catch (err) {
      setError(err.response?.data?.message || 'Error en el inicio de sesión');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!currentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};