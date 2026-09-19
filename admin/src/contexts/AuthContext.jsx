import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('milliy_narx_admin_user') || localStorage.getItem('milliy_narx_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('milliy_narx_admin_token') || localStorage.getItem('milliy_narx_token') || null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAdminSession() {
      if (token) {
        try {
          const profile = await authService.getMe();
          if (profile.role !== 'ADMIN') {
            logout();
          } else {
            const adminUser = {
              id: profile.id,
              email: profile.email,
              phone: profile.phone,
              role: profile.role,
              full_name: profile.profile?.full_name || 'Administrator',
            };
            setUser(adminUser);
            localStorage.setItem('milliy_narx_admin_user', JSON.stringify(adminUser));
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    verifyAdminSession();
  }, [token]);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    if (data.user?.role !== 'ADMIN') {
      throw new Error("Ushbu tizimga faqat tizim ma'murlari (ADMIN) kirishi mumkin.");
    }
    localStorage.setItem('milliy_narx_admin_token', data.access_token);
    localStorage.setItem('milliy_narx_admin_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('milliy_narx_admin_token');
    localStorage.removeItem('milliy_narx_admin_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user && user.role === 'ADMIN',
      isAdmin: user?.role === 'ADMIN',
      login,
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

export default AuthContext;
