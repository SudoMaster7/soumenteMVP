import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, profile, loading } = useAuthStore();
  return { user, profile, loading };
}
