import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { setAuthHeader } from '../api/axiosInstance';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const axiosWithTimeout = (config) => axios({ timeout: 5000, ...config });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = sessionStorage.getItem('edu_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  
  const [accessToken, setAccessToken] = useState(() => {
    return sessionStorage.getItem('edu_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Sync authorization header on token changes
  useEffect(() => {
    setAuthHeader(accessToken);
  }, [accessToken]);

  // Synchronize dynamic auth expired and token refresh window events
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setAccessToken(null);
      sessionStorage.removeItem('edu_token');
      sessionStorage.removeItem('edu_user');
      toast.error('Your session has expired or you have logged in from another device.');
    };

    const handleTokenRefreshed = (e) => {
      const newToken = e.detail?.accessToken;
      if (newToken) {
        setAccessToken(newToken);
        sessionStorage.setItem('edu_token', newToken);
      }
    };

    window.addEventListener('authExpired', handleAuthExpired);
    window.addEventListener('tokenRefreshed', handleTokenRefreshed);

    return () => {
      window.removeEventListener('authExpired', handleAuthExpired);
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
    };
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = sessionStorage.getItem('edu_token');
      const storedUser = sessionStorage.getItem('edu_user');

      if (storedToken && storedUser) {
        setLoading(false);
        // Verify token dynamically in the background to ensure it hasn't expired
        try {
          const profileRes = await axiosWithTimeout({
            method: 'get',
            url: `${API_URL}/users/me`,
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (profileRes.data.success) {
            setUser(profileRes.data.data);
            sessionStorage.setItem('edu_user', JSON.stringify(profileRes.data.data));
          }
        } catch {
          // Token is expired or invalid, reset session
          setUser(null);
          setAccessToken(null);
          sessionStorage.removeItem('edu_user');
          sessionStorage.removeItem('edu_token');
        }
        return;
      }

      try {
        const res = await axiosWithTimeout({ method: 'post', url: `${API_URL}/auth/refresh`, data: {}, withCredentials: true });
        if (res.data.success) {
          const token = res.data.data.accessToken;
          setAccessToken(token);
          sessionStorage.setItem('edu_token', token);

          // Fetch user profile
          const profileRes = await axiosWithTimeout({
            method: 'get',
            url: `${API_URL}/users/me`,
            headers: { Authorization: `Bearer ${token}` }
          });
          if (profileRes.data.success) {
            setUser(profileRes.data.data);
            sessionStorage.setItem('edu_user', JSON.stringify(profileRes.data.data));
          }
        }
      } catch {
        // Not authenticated
        setUser(null);
        setAccessToken(null);
        sessionStorage.removeItem('edu_user');
        sessionStorage.removeItem('edu_token');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userData = params.get('user');
    if (token) {
      setAccessToken(token);
      sessionStorage.setItem('edu_token', token);
      if (userData) {
        try {
          const parsed = JSON.parse(decodeURIComponent(userData));
          setUser(parsed);
          sessionStorage.setItem('edu_user', JSON.stringify(parsed));
          // Fetch full profile
          axiosWithTimeout({ method: 'get', url: `${API_URL}/users/me`, headers: { Authorization: `Bearer ${token}` } }).then(res => {
            if (res.data.success) {
              setUser(res.data.data);
              sessionStorage.setItem('edu_user', JSON.stringify(res.data.data));
            }
          }).catch(() => {});
        } catch {
          // Invalid user data
        }
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await axiosWithTimeout({ method: 'post', url: `${API_URL}/auth/login`, data: { email, password }, withCredentials: true });
    if (res.data.success) {
      const token = res.data.data.accessToken;
      const loggedUser = res.data.data.user;
      setAccessToken(token);
      setUser(loggedUser);
      sessionStorage.setItem('edu_token', token);
      sessionStorage.setItem('edu_user', JSON.stringify(loggedUser));
      return res.data.data;
    }
    throw new Error(res.data.message);
  }, []);

  const register = useCallback(async (userData) => {
    const res = await axiosWithTimeout({ method: 'post', url: `${API_URL}/auth/register`, data: userData });
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosWithTimeout({ method: 'post', url: `${API_URL}/auth/logout`, data: {}, headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true });
    } catch {
      // Ignore errors on logout
    }
    setUser(null);
    setAccessToken(null);
    sessionStorage.removeItem('edu_token');
    sessionStorage.removeItem('edu_user');
  }, [accessToken]);

  const refreshToken = useCallback(async () => {
    try {
      const res = await axiosWithTimeout({ method: 'post', url: `${API_URL}/auth/refresh`, data: {}, withCredentials: true });
      if (res.data.success) {
        const token = res.data.data.accessToken;
        setAccessToken(token);
        sessionStorage.setItem('edu_token', token);
        return token;
      }
    } catch {
      setUser(null);
      setAccessToken(null);
      sessionStorage.removeItem('edu_token');
      sessionStorage.removeItem('edu_user');
    }
    return null;
  }, []);

  const value = useMemo(() => ({
    user,
    setUser,
    accessToken,
    loading,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: !!user && !!accessToken,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
  }), [user, accessToken, loading, login, register, logout, refreshToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
