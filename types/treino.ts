export type MuscleGroup = 'costas' | 'peito' | 'pernas' | 'ombro' | 'braco' | 'fullbody' | 'esporte';

export type Difficulty = 'facil' | 'medio' | 'dificil';

export interface TreinoExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  load: number; // kg
  difficulty: Difficulty;
  completed?: boolean; // usado apenas durante o registro de uma sessão
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
