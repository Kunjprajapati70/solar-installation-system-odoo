import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import {
  createDemoSession,
  isDemoToken,
  sessionFromCredentials
} from '../data/demoSession';

const AuthContext = createContext(null);

const getSavedToken = () => {
  const saved = localStorage.getItem('sunpower_token');
  return saved && saved !== 'undefined' && saved !== 'null' ? saved : null;
};

const getSavedUser = () => {
  try {
    const raw = localStorage.getItem('sunpower_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistSession = (tokenStr, userObj) => {
  if (tokenStr) localStorage.setItem('sunpower_token', tokenStr);
  if (userObj) localStorage.setItem('sunpower_user', JSON.stringify(userObj));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getSavedUser);
  const [token, setToken] = useState(getSavedToken);
  const [loading, setLoading] = useState(() => {
    const saved = getSavedToken();
    return Boolean(saved) && !isDemoToken(saved);
  });

  useEffect(() => {
    const fetchUser = async () => {
      const activeToken = getSavedToken();
      if (!activeToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      if (isDemoToken(activeToken)) {
        const savedUser = getSavedUser();
        if (savedUser) setUser(savedUser);
        setToken(activeToken);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.success) {
          const userObj = res.user || res.data?.user || res.data;
          setUser(userObj);
          persistSession(activeToken, userObj);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Fetch me error:', err);
        const savedUser = getSavedUser();
        if (savedUser) {
          setUser(savedUser);
        } else {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const applySession = (tokenStr, userObj) => {
    persistSession(tokenStr, userObj);
    setToken(tokenStr);
    setUser(userObj);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password }, { timeout: 8000 });
      if (res.success) {
        const tokenStr = res.token || res.data?.token;
        const userObj = res.user || res.data?.user || res.data;
        if (tokenStr) applySession(tokenStr, userObj);
        else setUser(userObj);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      const demo = sessionFromCredentials(email, password);
      if (demo) {
        applySession(demo.token, demo.user);
        return { success: true, demo: true };
      }
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (role) => {
    setLoading(true);
    try {
      const res = await api.post(`/auth/demo-login/${role}`, {}, { timeout: 8000 });
      if (res.success) {
        const tokenStr = res.token || res.data?.token;
        const userObj = res.user || res.data?.user || res.data;
        if (tokenStr) applySession(tokenStr, userObj);
        else setUser(userObj);
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to switch role' };
    } catch (err) {
      const demo = createDemoSession(role);
      if (demo) {
        applySession(demo.token, demo.user);
        return { success: true, demo: true };
      }
      console.error('Switch role error:', err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sunpower_token');
    localStorage.removeItem('sunpower_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    switchRole,
    logout,
    isAdmin: user?.role === 'admin',
    isSales: user?.role === 'sales',
    isTechnician: user?.role === 'technician',
    isCustomer: user?.role === 'customer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
