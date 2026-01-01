import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// ✅ Use env if available, fallback to your Render backend
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://the-project-club-backend.onrender.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);

      return { success: true };
    } catch (error) {
      const code = error.response?.data?.code; // ex: EMAIL_NOT_VERIFIED
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, code, message };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, userData);

      const { token, user, message, requiresEmailVerification } = response.data;

      if (token) localStorage.setItem('token', token);
      if (user) setUser(user);

      return {
        success: true,
        message: message || 'Signup successful',
        requiresEmailVerification: !!requiresEmailVerification,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed',
      };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/resend-verification`,
        { email }
      );

      return {
        success: true,
        message: response.data?.message || 'Verification email sent',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend verification email',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    resendVerification,
    isAuthenticated: !!user,
    API_BASE_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
