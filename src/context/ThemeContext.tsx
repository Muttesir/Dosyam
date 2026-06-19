import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, ThemeColors } from '../theme';

type Scheme = 'dark' | 'light';
const STORAGE_KEY = 'app_theme_scheme';

interface ThemeCtx {
  C: ThemeColors;
  scheme: Scheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  C: darkTheme,
  scheme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setScheme] = useState<Scheme>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v === 'light' || v === 'dark') setScheme(v);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setScheme(prev => {
      const next: Scheme = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const C = useMemo(() => scheme === 'dark' ? darkTheme : lightTheme, [scheme]);

  return (
    <ThemeContext.Provider value={{ C, scheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}
