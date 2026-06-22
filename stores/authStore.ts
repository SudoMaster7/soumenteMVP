import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { DEV_AUTH_ENABLED, DEV_USER } from '@/lib/devAuth';
import type { Profile } from '@/types';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: any) => void;
  setProfile: (profile: Profile) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId) => {
    if (DEV_AUTH_ENABLED) {
      set({
        user: DEV_USER,
        profile: {
          id: DEV_USER.id,
          name: 'Desenvolvimento',
          email: DEV_USER.email,
          notification_time: '09:00',
          notifications_enabled: false,
          onboarded: true,
          created_at: new Date().toISOString(),
        },
        loading: false,
      });
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    set({ profile: data ?? null, loading: false });
  },

  signOut: async () => {
    if (DEV_AUTH_ENABLED) {
      set({ user: null, profile: null, loading: false });
      return;
    }

    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
