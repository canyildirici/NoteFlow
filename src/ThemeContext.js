import React, { createContext, useContext, useState } from 'react';

const dark = {
  bg: '#0d0d14',
  surface: '#13131f',
  surface2: '#1c1c2e',
  border: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9',
  text2: '#6b7280',
  blue: '#3b82f6',
};

const light = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surface2: '#f1f5f9',
  border: 'rgba(0,0,0,0.08)',
  text: '#0f172a',
  text2: '#6b7280',
  blue: '#3b82f6',
};

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? dark : light;
  const toggleTheme = () => setIsDark(prev => !prev);
  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);