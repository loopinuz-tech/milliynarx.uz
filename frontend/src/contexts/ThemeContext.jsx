import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

const THEME_STORAGE_KEY = 'milliynarx_theme_preference';

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      // Faqat foydalanuvchi o'zi qo'lda tanlagan bo'lsa olinadi
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      // Eski avtomatik saqlanib qolgan dark qiymatni tozalaymiz
      localStorage.removeItem('milliynarx_theme');
    } catch (e) {
      console.error(e);
    }
    // 1-kirganda sayt har doim LIGHT mode rejimda bo'lishi kerak
    return 'light';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
        localStorage.setItem('milliynarx_theme', next);
      } catch (e) {}
      return next;
    });
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        localStorage.setItem('milliynarx_theme', newTheme);
      } catch (e) {}
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
