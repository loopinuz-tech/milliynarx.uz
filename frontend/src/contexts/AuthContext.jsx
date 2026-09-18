import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('milliy_narx_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('milliy_narx_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyToken() {
      if (token) {
        try {
          const profile = await authService.getMe();
          const updatedUser = {
            id: profile.id,
            email: profile.email,
            phone: profile.phone,
            role: profile.role,
            full_name: profile.profile?.full_name,
            store_name: profile.seller?.store_name,
            seller_status: profile.seller?.status,
            is_verified: profile.is_verified,
            telegram_chat_id: profile.telegram_chat_id,
            telegram_username: profile.telegram_username,
            telegram_connected_at: profile.telegram_connected_at,
            plan: profile.seller?.plan || profile.plan || 'STARTER',
            ai_queries_limit: profile.seller?.ai_queries_limit || profile.ai_queries_limit || 5,
            ai_queries_used: profile.seller?.ai_queries_used || profile.ai_queries_used || 0
          };
          setUser(updatedUser);
          localStorage.setItem('milliy_narx_user', JSON.stringify(updatedUser));
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    }
    verifyToken();
  }, [token]);

  const refreshUser = async () => {
    if (!token) return null;
    try {
      const profile = await authService.getMe();
      const updatedUser = {
        id: profile.id,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        full_name: profile.profile?.full_name,
        store_name: profile.seller?.store_name,
        seller_status: profile.seller?.status,
        is_verified: profile.is_verified,
        telegram_chat_id: profile.telegram_chat_id,
        telegram_username: profile.telegram_username,
        telegram_connected_at: profile.telegram_connected_at,
        plan: profile.seller?.plan || profile.plan || 'STARTER',
        ai_queries_limit: profile.seller?.ai_queries_limit || profile.ai_queries_limit || 5,
        ai_queries_used: profile.seller?.ai_queries_used || profile.ai_queries_used || 0
      };
      setUser(updatedUser);
      localStorage.setItem('milliy_narx_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch {
      return null;
    }
  };

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    localStorage.setItem('milliy_narx_token', data.access_token);
    localStorage.setItem('milliy_narx_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    localStorage.setItem('milliy_narx_token', data.access_token);
    localStorage.setItem('milliy_narx_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const loginWithToken = (accessToken, userData) => {
    localStorage.setItem('milliy_narx_token', accessToken);
    localStorage.setItem('milliy_narx_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('milliy_narx_token');
    localStorage.removeItem('milliy_narx_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      isSeller: user?.role === 'SELLER',
      isBuyer: user?.role === 'BUYER',
      login,
      register,
      loginWithToken,
      refreshUser,
      logout
    }}>
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
