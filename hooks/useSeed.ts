import { useState, useEffect, useCallback } from 'react';
import { getActiveSeed, getSeeds } from '@/services/seedService';
import { getCurrentUser } from '@/services/authService';
import type { Seed } from '@/types';

export function useSeed() {
  const [seed, setSeed] = useState<Seed | null>(null);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchSeed = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;
      setUserId(user.id);
      const [activeSeed, allSeeds] = await Promise.all([
        getActiveSeed(user.id),
        getSeeds(user.id),
      ]);
      setSeed(activeSeed);
      setSeeds(allSeeds);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeed();
  }, [fetchSeed]);

  return { seed, seeds, userId, loading, refetch: fetchSeed };
}
