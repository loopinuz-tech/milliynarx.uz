import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    try {
      const pref = localStorage.getItem('milliynarx_admin_theme');
      return pref ? pref === 'dark' : true; // default dark for admin
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('milliynarx_admin_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('milliynarx_admin_theme', 'light');
      }
    } catch (e) {}
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return { isDark: true, toggleTheme: () => {} };
  }
  return context;
};

export default ThemeContext;
