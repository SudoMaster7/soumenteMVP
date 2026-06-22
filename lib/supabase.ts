import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { DEV_AUTH_ENABLED } from '@/lib/devAuth';

const WebStorageAdapter = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

const NoopStorageAdapter = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.');
}

if (DEV_AUTH_ENABLED && Platform.OS === 'web' && typeof window !== 'undefined') {
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith('sb-'))
    .forEach((key) => window.localStorage.removeItem(key));
}

const authStorage = DEV_AUTH_ENABLED
  ? NoopStorageAdapter
  : Platform.OS === 'web'
    ? WebStorageAdapter
    : ExpoSecureStoreAdapter;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: !DEV_AUTH_ENABLED,
    persistSession: !DEV_AUTH_ENABLED,
    detectSessionInUrl: false,
  },
});
