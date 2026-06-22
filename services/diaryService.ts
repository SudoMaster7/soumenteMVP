import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { isDevUser } from '@/lib/devAuth';
import type { DiaryEntry } from '@/types';

const LOCAL_DIARY_KEY = 'soumente-dev-diary-entries';

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function newId() {
  return `diary-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readLocalEntries(): Promise<DiaryEntry[]> {
  const raw = await AsyncStorage.getItem(LOCAL_DIARY_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeLocalEntries(entries: DiaryEntry[]) {
  await AsyncStorage.setItem(LOCAL_DIARY_KEY, JSON.stringify(entries));
}

export async function getTodayEntry(userId: string): Promise<DiaryEntry | null> {
  const today = getLocalDateString();

  if (isDevUser(userId)) {
    const entries = await readLocalEntries();
    return entries.find(entry => entry.user_id === userId && entry.entry_date === today) ?? null;
  }

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

  if (isDevUser(userId)) {
    const entries = await readLocalEntries();
    const existing = entries.find(item => item.user_id === userId && item.entry_date === entryDate);
    const now = new Date().toISOString();
    const saved: DiaryEntry = {
      id: existing?.id ?? newId(),
      user_id: userId,
      emotion_primary: entry.emotion_primary ?? existing?.emotion_primary ?? 'reflective',
      emotion_secondary: entry.emotion_secondary ?? existing?.emotion_secondary,
      text: entry.text,
      dimension: entry.dimension ?? existing?.dimension ?? 'medium',
      field: entry.field ?? existing?.field,
      photo_url: entry.photo_url ?? existing?.photo_url,
      ai_insight: entry.ai_insight ?? existing?.ai_insight,
      seed_id: entry.seed_id ?? existing?.seed_id,
      entry_date: entryDate,
      created_at: existing?.created_at ?? now,
    };

    const next = existing
      ? entries.map(item => (item.id === existing.id ? saved : item))
      : [saved, ...entries];
    await writeLocalEntries(next);
    return saved;
  }

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
  if (isDevUser(userId)) {
    const entries = await readLocalEntries();
    return entries
      .filter(entry => entry.user_id === userId)
      .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
      .slice(0, limit);
  }

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
  const weekAgoString = getLocalDateString(weekAgo);

  if (isDevUser(userId)) {
    const entries = await readLocalEntries();
    return entries
      .filter(entry => entry.user_id === userId && entry.entry_date >= weekAgoString)
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  }

  const { data } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', weekAgoString)
    .order('entry_date', { ascending: true });
  return data || [];
}

export async function getStreak(userId: string): Promise<number> {
  const data = isDevUser(userId)
    ? (await readLocalEntries())
        .filter(entry => entry.user_id === userId)
        .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
        .slice(0, 60)
    : (await supabase
        .from('diary_entries')
        .select('entry_date')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .limit(60)).data;

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
