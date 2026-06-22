import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type AppThemeName = 'light' | 'dark';

export type AppTheme = {
  name: AppThemeName;
  isDark: boolean;
  colors: {
    background: string;
    backgroundAlt: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    text: string;
    muted: string;
    subtle: string;
    primary: string;
    primaryText: string;
    primarySoft: string;
    accent: string;
    accentSoft: string;
    danger: string;
    dangerSoft: string;
    success: string;
    successSoft: string;
    warning: string;
    tab: string;
  };
};

const THEME_KEY = 'soumente-theme';

const darkTheme: AppTheme = {
  name: 'dark',
  isDark: true,
  colors: {
    background: '#07110F',
    backgroundAlt: '#0D1A17',
    surface: '#12211D',
    surfaceElevated: '#182B26',
    border: '#26443B',
    text: '#F4EFE4',
    muted: '#B7AA9A',
    subtle: '#7E8E84',
    primary: '#F2B36D',
    primaryText: '#21140A',
    primarySoft: 'rgba(242,179,109,0.16)',
    accent: '#88D4B4',
    accentSoft: 'rgba(136,212,180,0.14)',
    danger: '#FF8A7A',
    dangerSoft: 'rgba(255,138,122,0.13)',
    success: '#79D39C',
    successSoft: 'rgba(121,211,156,0.14)',
    warning: '#E8C65D',
    tab: '#0A1714',
  },
};

const lightTheme: AppTheme = {
  name: 'light',
  isDark: false,
  colors: {
    background: '#F6F1E8',
    backgroundAlt: '#E9F0E7',
    surface: '#FFFDF7',
    surfaceElevated: '#FFFFFF',
    border: '#D8D6C7',
    text: '#22312C',
    muted: '#66766E',
    subtle: '#9AA79F',
    primary: '#B85F3B',
    primaryText: '#FFFFFF',
    primarySoft: 'rgba(184,95,59,0.12)',
    accent: '#277C68',
    accentSoft: 'rgba(39,124,104,0.12)',
    danger: '#B94A3E',
    dangerSoft: 'rgba(185,74,62,0.1)',
    success: '#2F8A5F',
    successSoft: 'rgba(47,138,95,0.12)',
    warning: '#A9781A',
    tab: '#FFFDF7',
  },
};

const themes = { light: lightTheme, dark: darkTheme } as const;

type ThemeContextValue = {
  theme: AppTheme;
  themeName: AppThemeName;
  setThemeName: (name: AppThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeName, setThemeNameState] = useState<AppThemeName>(systemScheme === 'light' ? 'light' : 'dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setThemeNameState(saved);
      }
    });
  }, []);

  const setThemeName = (name: AppThemeName) => {
    setThemeNameState(name);
    void AsyncStorage.setItem(THEME_KEY, name);
  };

  const value = useMemo<ThemeContextValue>(() => ({
    theme: themes[themeName],
    themeName,
    setThemeName,
    toggleTheme: () => setThemeName(themeName === 'dark' ? 'light' : 'dark'),
  }), [themeName]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
