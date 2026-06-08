export type SeedType = 'dream' | 'career' | 'health' | 'relationship' | 'finance' | 'custom';
export type SeedStatus = 'seed' | 'planted' | 'growing' | 'fruiting' | 'harvested';
export type EmotionType = 'motivated' | 'serene' | 'anxious' | 'reflective' | 'joyful' | 'melancholic';
export type DimensionType = 'subtle' | 'medium' | 'deep' | 'transformative';
export type FieldType = 'physical' | 'emotional' | 'mental' | 'spiritual';
export type RootType = 'daily' | 'weekly' | 'milestone';

export interface Profile {
  id: string;
  name: string;
  email: string;
  notification_time: string;
  notifications_enabled: boolean;
  onboarded: boolean;
  created_at: string;
}

export interface Seed {
  id: string;
  user_id: string;
  name: string;
  type: SeedType;
  why?: string;
  for_whom?: string;
  deadline?: string;
  status: SeedStatus;
  planted_at?: string;
  harvested_at?: string;
  ai_questions?: string[];
  created_at: string;
  roots?: Root[];
  fruits?: Fruit[];
}

export interface Root {
  id: string;
  seed_id: string;
  user_id: string;
  name: string;
  description?: string;
  type: RootType;
  frequency: number;
  strength: number;      // 0-100
  completed_count: number;
  last_completed_at?: string;
  created_at: string;
}

export interface RootCompletion {
  id: string;
  root_id: string;
  user_id: string;
  note?: string;
  completed_at: string;
}

export interface Fruit {
  id: string;
  seed_id: string;
  user_id: string;
  name: string;
  description?: string;
  icon: string;
  harvested_at: string;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  emotion_primary: EmotionType;
  emotion_secondary?: EmotionType;
  text?: string;
  dimension: DimensionType;
  field?: FieldType;
  photo_url?: string;
  ai_insight?: string;
  seed_id?: string;
  entry_date: string;
  created_at: string;
}

export interface AIReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  dominant_emotion?: string;
  pattern_analysis?: string;
  seed_progress?: Record<string, number>;
  recommendations?: string;
  generated_at: string;
}