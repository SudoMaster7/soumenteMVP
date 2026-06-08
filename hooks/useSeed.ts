import { useState, useEffect } from 'react';
import { getActiveSeed } from '@/services/seedService';
import { getCurrentUser } from '@/services/authService';
import type { Seed } from '@/types';

export function useSeed() {
  const [seed, setSeed] = useState<Seed | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  async function fetchSeed() {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;
      setUserId(user.id);
      const data = await getActiveSeed(user.id);
      setSeed(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSeed();
  }, []);

  return { seed, userId, loading, refetch: fetchSeed };
}
