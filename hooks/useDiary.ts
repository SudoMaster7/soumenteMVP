import { useState, useEffect } from 'react';
import { getTodayEntry, getDiaryHistory, getStreak } from '@/services/diaryService';
import { getCurrentUser } from '@/services/authService';
import type { DiaryEntry } from '@/types';

export function useDiary() {
  const [todayEntry, setTodayEntry] = useState<DiaryEntry | null>(null);
  const [history, setHistory] = useState<DiaryEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchDiary() {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;
      const [today, hist, str] = await Promise.all([
        getTodayEntry(user.id),
        getDiaryHistory(user.id),
        getStreak(user.id),
      ]);
      setTodayEntry(today);
      setHistory(hist);
      setStreak(str);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDiary();
  }, []);

  return { todayEntry, history, streak, loading, refetch: fetchDiary };
}
