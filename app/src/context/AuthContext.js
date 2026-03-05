import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import SecureStore from '../services/secureStore';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('agrilink_token').then(async (token) => {
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
          setProfile(data.profile);
        } catch {
          await SecureStore.deleteItemAsync('agrilink_token');
        }
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('agrilink_token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    await SecureStore.setItemAsync('agrilink_token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('agrilink_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setProfile(data.profile);
    return data.profile;
  }, []);

  const value = useMemo(() => ({ user, profile, loading, login, register, logout, refreshProfile }), [
    user,
    profile,
    loading,
    login,
    register,
    logout,
    refreshProfile,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
