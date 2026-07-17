import type { Ionicons } from '@expo/vector-icons';
import type { MuscleGroup, TreinoTemplate } from '@/types/treino';

export const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  costas: 'Costas',
  peito: 'Peito',
  pernas: 'Pernas',
  ombro: 'Ombro',
  braco: 'Braço',
  fullbody: 'Full Body',
  esporte: 'Esporte',
};

export const MUSCLE_GROUP_ICON: Record<MuscleGroup, keyof typeof Ionicons.glyphMap> = {
  costas: 'body-outline',
  peito: 'body-outline',
  pernas: 'walk-outline',
  ombro: 'barbell-outline',
  braco: 'barbell-outline',
  fullbody: 'fitness-outline',
  esporte: 'football-outline',
};

export const MUSCLE_GROUPS: MuscleGroup[] = ['costas', 'peito', 'pernas', 'ombro', 'braco', 'fullbody', 'esporte'];

export const DEFAULT_TEMPLATES: TreinoTemplate[] = [
  {
    id: 'tpl-costas',
    group: 'costas',
    name: 'Costas padrão',
    exercises: [
      { id: 'e1', name: 'Puxada frontal', sets: 4, reps: 10, load: 40 },
      { id: 'e2', name: 'Remada curvada', sets: 4, reps: 10, load: 30 },
      { id: 'e3', name: 'Remada baixa', sets: 3, reps: 12, load: 35 },
    ],
  },
  {
    id: 'tpl-peito',
    group: 'peito',
    name: 'Peito padrão',
    exercises: [
      { id: 'e1', name: 'Supino reto', sets: 4, reps: 10, load: 40 },
      { id: 'e2', name: 'Supino inclinado', sets: 4, reps: 10, load: 30 },
      { id: 'e3', name: 'Crucifixo', sets: 3, reps: 12, load: 12 },
    ],
  },
  {
    id: 'tpl-pernas',
    group: 'pernas',
    name: 'Pernas padrão',
    exercises: [
      { id: 'e1', name: 'Agachamento', sets: 4, reps: 10, load: 50 },
      { id: 'e2', name: 'Leg press', sets: 4, reps: 12, load: 80 },
      { id: 'e3', name: 'Cadeira extensora', sets: 3, reps: 12, load: 30 },
    ],
  },
  {
    id: 'tpl-ombro',
    group: 'ombro',
    name: 'Ombro padrão',
    exercises: [
      { id: 'e1', name: 'Desenvolvimento', sets: 4, reps: 10, load: 20 },
      { id: 'e2', name: 'Elevação lateral', sets: 3, reps: 12, load: 8 },
    ],
  },
  {
    id: 'tpl-braco',
    group: 'braco',
    name: 'Braço padrão',
    exercises: [
      { id: 'e1', name: 'Rosca direta', sets: 3, reps: 12, load: 15 },
      { id: 'e2', name: 'Tríceps corda', sets: 3, reps: 12, load: 15 },
    ],
  },
  {
    id: 'tpl-fullbody',
    group: 'fullbody',
    name: 'Full body padrão',
    exercises: [
      { id: 'e1', name: 'Agachamento', sets: 3, reps: 10, load: 40 },
      { id: 'e2', name: 'Supino reto', sets: 3, reps: 10, load: 30 },
      { id: 'e3', name: 'Remada curvada', sets: 3, reps: 10, load: 25 },
    ],
  },
  {
    id: 'tpl-esporte',
    group: 'esporte',
    name: 'Esporte padrão',
    exercises: [
      { id: 'e1', name: 'Aquecimento', sets: 1, reps: 1, load: 0 },
      { id: 'e2', name: 'Sessão principal', sets: 1, reps: 1, load: 0 },
    ],
  },
];
