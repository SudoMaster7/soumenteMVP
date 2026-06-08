import { supabase } from '@/lib/supabase';
import type { DiaryEntry } from '@/types';

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getTodayEntry(userId: string): Promise<DiaryEntry | null> {
  const today = getLocalDateString();
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', today)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveDiaryEntry(
  userId: string,
  entry: Partial<DiaryEntry>
): Promise<DiaryEntry> {
  const entryDate = getLocalDateString();
  const payload = {
    ...entry,
    user_id: userId,
    entry_date: entryDate,
  };

  const { data: existing, error: existingError } = await supabase
    .from('diary_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('entry_date', entryDate)
    .maybeSingle();

  if (existingError) throw existingError;

  const query = existing
    ? supabase.from('diary_entries').update(payload).eq('id', existing.id)
    : supabase.from('diary_entries').insert(payload);

  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function getDiaryHistory(userId: string, limit = 30): Promise<DiaryEntry[]> {
  const { data } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getWeekEntries(userId: string): Promise<DiaryEntry[]> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', getLocalDateString(weekAgo))
    .order('entry_date', { ascending: true });
  return data || [];
}

export async function getStreak(userId: string): Promise<number> {
  const { data } = await supabase
    .from('diary_entries')
    .select('entry_date')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .limit(60);

  if (!data || data.length === 0) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < data.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (data[i].entry_date === getLocalDateString(expected)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
