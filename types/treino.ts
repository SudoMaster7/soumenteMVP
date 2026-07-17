export type MuscleGroup = 'costas' | 'peito' | 'pernas' | 'ombro' | 'braco' | 'fullbody' | 'esporte';

export interface TreinoExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  load: number; // kg
}

export interface TreinoTemplate {
  id: string;
  group: MuscleGroup;
  name: string;
  exercises: TreinoExercise[];
}

export interface TreinoSession {
  id: string;
  templateId?: string;
  group: MuscleGroup;
  date: string; // ISO string
  durationMinutes: number;
  notes: string;
  exercises: TreinoExercise[];
}
