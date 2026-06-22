import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDiaryHistory, getStreak } from './diaryService';
import { getSeeds } from './seedService';
import type { Root, Seed } from '@/types';

const WEEKLY_INTENTION_KEY = 'soumente-weekly-intentions';

export type ConsciousnessLevel = {
  level: number;
  name: string;
  description: string;
  progress: number;
  nextLabel: string;
};

export type Achievement = {
  id: string;
  title: string;
  message: string;
  unlocked: boolean;
};

export type GrowthProfile = {
  level: ConsciousnessLevel;
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  nextAchievement: Achievement | null;
  stats: {
    diaryEntries: number;
    streak: number;
    seeds: number;
    strongRoots: number;
    completedRoots: number;
  };
};

type WeeklyIntentions = Record<string, string>;

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function getAllRoots(seeds: Seed[]): Root[] {
  return seeds.flatMap(seed => seed.roots ?? []);
}

function getDaysSince(date?: string) {
  if (!date) return 0;
  const created = new Date(date).getTime();
  if (Number.isNaN(created)) return 0;
  const diff = Date.now() - created;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function buildLevel(stats: GrowthProfile['stats'], seeds: Seed[]): ConsciousnessLevel {
  const oldestSeedDays = seeds.reduce((max, seed) => Math.max(max, getDaysSince(seed.created_at)), 0);
  const strongSeedCount = seeds.filter(seed => {
    const roots = seed.roots ?? [];
    if (!roots.length) return false;
    const average = roots.reduce((total, root) => total + (root.strength || 0), 0) / roots.length;
    return average >= 80;
  }).length;

  if (oldestSeedDays >= 365 && stats.streak >= 30) {
    return {
      level: 7,
      name: 'Guardiao da Floresta',
      description: 'Voce construiu uma identidade de cultivo que atravessa o tempo.',
      progress: 100,
      nextLabel: 'Manter o legado vivo',
    };
  }

  if (oldestSeedDays >= 180 && strongSeedCount >= 5) {
    return {
      level: 6,
      name: 'Floresta',
      description: 'Varias sementes ja formam um ecossistema pessoal.',
      progress: clamp((strongSeedCount / 5) * 100),
      nextLabel: 'Sustentar por 1 ano',
    };
  }

  if (oldestSeedDays >= 90 && stats.diaryEntries >= 56) {
    return {
      level: 5,
      name: 'Arvore Madura',
      description: 'O sistema ja tem memoria suficiente para devolver padroes com profundidade.',
      progress: clamp((stats.diaryEntries / 56) * 100),
      nextLabel: 'Fortalecer 5 sementes',
    };
  }

  if (oldestSeedDays >= 30 && stats.seeds >= 2) {
    return {
      level: 4,
      name: 'Arvore Jovem',
      description: 'Voce ja nao esta apenas comecando. Existe continuidade visivel.',
      progress: clamp((oldestSeedDays / 90) * 100),
      nextLabel: 'Chegar a 3 meses de uso',
    };
  }

  if (stats.strongRoots > 0) {
    return {
      level: 3,
      name: 'Raiz Forte',
      description: 'Uma raiz ganhou forca suficiente para sustentar movimento real.',
      progress: clamp((stats.strongRoots / 2) * 100),
      nextLabel: 'Cultivar 2 sementes por 30 dias',
    };
  }

  if (stats.streak >= 7) {
    return {
      level: 2,
      name: 'Broto',
      description: 'A repeticao ja apareceu. O solo esta ficando fertil.',
      progress: clamp((stats.streak / 21) * 100),
      nextLabel: 'Fortalecer uma raiz ate 80%',
    };
  }

  return {
    level: 1,
    name: 'Semente',
    description: 'O primeiro gesto ja existe. Agora o foco e voltar amanha.',
    progress: clamp((stats.streak / 7) * 100),
    nextLabel: 'Completar 7 dias de diario',
  };
}

function buildAchievements(stats: GrowthProfile['stats'], seeds: Seed[]): Achievement[] {
  const allSeedsActiveLongEnough = seeds.length > 0 && seeds.every(seed => getDaysSince(seed.created_at) >= 90);

  return [
    {
      id: 'first-sprout',
      title: 'Primeiro Broto',
      message: 'Voce plantou sua primeira intencao no mundo.',
      unlocked: stats.seeds > 0,
    },
    {
      id: 'seven-days',
      title: 'Sete Dias de Cultivo',
      message: 'Uma semana inteira. O solo esta fertil.',
      unlocked: stats.streak >= 7,
    },
    {
      id: 'deep-root',
      title: 'Raiz Profunda',
      message: 'Uma raiz chegou a 100%. Isso agora sustenta algo real.',
      unlocked: stats.strongRoots > 0,
    },
    {
      id: 'garden-guardian',
      title: 'Guardiao do Jardim',
      message: 'Voce nao abandonou suas sementes ativas. Isso cria identidade.',
      unlocked: allSeedsActiveLongEnough,
    },
    {
      id: 'faithful-mirror',
      title: 'Espelho Fiel',
      message: 'Voce registrou 50 sinais internos. Sua escuta ficou mais refinada.',
      unlocked: stats.diaryEntries >= 50,
    },
  ];
}

export async function getGrowthProfile(userId: string): Promise<GrowthProfile> {
  const [entries, streak, seeds] = await Promise.all([
    getDiaryHistory(userId, 365),
    getStreak(userId),
    getSeeds(userId),
  ]);

  const roots = getAllRoots(seeds);
  const stats = {
    diaryEntries: entries.length,
    streak,
    seeds: seeds.length,
    strongRoots: roots.filter(root => (root.strength || 0) >= 80).length,
    completedRoots: roots.reduce((total, root) => total + (root.completed_count || 0), 0),
  };
  const achievements = buildAchievements(stats, seeds);
  const unlockedAchievements = achievements.filter(achievement => achievement.unlocked);
  const nextAchievement = achievements.find(achievement => !achievement.unlocked) ?? null;

  return {
    level: buildLevel(stats, seeds),
    achievements,
    unlockedAchievements,
    nextAchievement,
    stats,
  };
}

async function readIntentions(): Promise<WeeklyIntentions> {
  const raw = await AsyncStorage.getItem(WEEKLY_INTENTION_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function getWeeklyIntention(userId: string): Promise<string> {
  const intentions = await readIntentions();
  return intentions[userId] ?? '';
}

export async function saveWeeklyIntention(userId: string, intention: string): Promise<void> {
  const intentions = await readIntentions();
  intentions[userId] = intention.trim();
  await AsyncStorage.setItem(WEEKLY_INTENTION_KEY, JSON.stringify(intentions));
}
