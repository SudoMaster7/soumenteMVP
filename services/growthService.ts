import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDiaryHistory, getStreak } from './diaryService';
import { getSeeds } from './seedService';
import type { DiaryEntry, Root, Seed } from '@/types';

const WEEKLY_INTENTION_KEY = 'soumente-weekly-intentions';
const UNLOCKED_ACHIEVEMENTS_KEY = 'soumente-unlocked-achievements';
const MAX_LEVEL_KEY = 'soumente-max-consciousness-level';
const WEEKLY_REPORT_READS_KEY = 'soumente-weekly-report-reads';

export type GrowthStats = {
  diaryEntries: number;
  streak: number;
  seeds: number;
  activeSeeds: number;
  roots: number;
  strongRoots: number;
  legendaryRoots: number;
  completedRoots: number;
  weeklyReportsRead: number;
  oldestSeedDays: number;
  activeDaysLast30: number;
};

export type ConsciousnessLevel = {
  level: number;
  name: string;
  description: string;
  minScore: number;
  progress: number;
  nextLabel: string;
};

export type Achievement = {
  id: string;
  title: string;
  message: string;
  category: 'Diário' | 'Raízes' | 'Sementes' | 'Relatório' | 'Padrões' | 'Nível' | 'Consistência' | 'Retenção';
  unlocked: boolean;
  distance: number;
};

export type GrowthProfile = {
  score: number;
  level: ConsciousnessLevel;
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  newlyUnlockedAchievements: Achievement[];
  nextAchievement: Achievement | null;
  stats: GrowthStats;
};

type WeeklyIntentions = Record<string, string>;
type StoredAchievementMap = Record<string, string[]>;
type StoredLevelMap = Record<string, number>;
type StoredReportReads = Record<string, string[]>;

const LEVELS = [
  { level: 1, name: 'Semente', minScore: 0, nextLabel: 'Chegar a 120 pontos', description: 'O primeiro gesto já existe. Agora o foco é voltar amanhã.' },
  { level: 2, name: 'Broto', minScore: 120, nextLabel: 'Fortalecer uma raiz até 80%', description: 'A repetição já apareceu. O solo está ficando fértil.' },
  { level: 3, name: 'Raiz Forte', minScore: 300, nextLabel: 'Cultivar 2 sementes por 30 dias', description: 'Uma raiz ganhou força suficiente para sustentar movimento real.' },
  { level: 4, name: 'Árvore Jovem', minScore: 650, nextLabel: 'Chegar a 3 meses de uso', description: 'Você já não está apenas começando. Existe continuidade visível.' },
  { level: 5, name: 'Árvore Madura', minScore: 1200, nextLabel: 'Formar uma floresta de raízes fortes', description: 'O sistema já tem memória suficiente para devolver padrões com profundidade.' },
  { level: 6, name: 'Floresta', minScore: 2200, nextLabel: 'Sustentar por 1 ano', description: 'Várias sementes já formam um ecossistema pessoal.' },
  { level: 7, name: 'Guardião da Floresta', minScore: 4000, nextLabel: 'Manter o legado vivo', description: 'Você construiu uma identidade de cultivo que atravessa o tempo.' },
] as const;

const ACHIEVEMENT_PRIORITY: Record<Achievement['category'], number> = {
  Diário: 1,
  Raízes: 2,
  Sementes: 3,
  Relatório: 4,
  Padrões: 5,
  Nível: 6,
  Consistência: 7,
  Retenção: 8,
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekKey(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return getLocalDateString(start);
}

function getDaysSince(date?: string) {
  if (!date) return 0;
  const created = new Date(date).getTime();
  if (Number.isNaN(created)) return 0;
  const diff = Date.now() - created;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getAllRoots(seeds: Seed[]): Root[] {
  return seeds.flatMap(seed => seed.roots ?? []);
}

function getActiveDaysLast30(entries: DiaryEntry[]) {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceKey = getLocalDateString(since);
  return new Set(entries.filter(entry => entry.entry_date >= sinceKey).map(entry => entry.entry_date)).size;
}

function calculateScore(stats: GrowthStats) {
  return (
    Math.min(stats.diaryEntries, 120) * 2
    + Math.min(stats.streak, 60) * 6
    + stats.seeds * 25
    + stats.activeSeeds * 15
    + stats.strongRoots * 35
    + stats.legendaryRoots * 50
    + stats.completedRoots * 4
    + stats.weeklyReportsRead * 20
  );
}

function canEnterLevel(level: number, stats: GrowthStats, score: number) {
  switch (level) {
    case 1:
      return true;
    case 2:
      return score >= 120 && (stats.streak >= 7 || stats.diaryEntries >= 10);
    case 3:
      return score >= 300 && stats.strongRoots >= 1;
    case 4:
      return score >= 650 && stats.oldestSeedDays >= 30 && stats.seeds >= 2;
    case 5:
      return score >= 1200 && stats.oldestSeedDays >= 90 && stats.diaryEntries >= 50;
    case 6:
      return score >= 2200 && stats.oldestSeedDays >= 180 && stats.strongRoots >= 5;
    case 7:
      return score >= 4000 && stats.oldestSeedDays >= 365 && stats.streak >= 30;
    default:
      return false;
  }
}

function buildLevel(score: number, stats: GrowthStats, storedMaxLevel: number): ConsciousnessLevel {
  const computedLevel = [...LEVELS].reverse().find(level => canEnterLevel(level.level, stats, score)) ?? LEVELS[0];
  const levelNumber = Math.max(computedLevel.level, storedMaxLevel || 1);
  const level = LEVELS.find(item => item.level === levelNumber) ?? LEVELS[0];
  const nextLevel = LEVELS.find(item => item.level === levelNumber + 1);
  const progress = nextLevel
    ? clamp(((score - level.minScore) / (nextLevel.minScore - level.minScore)) * 100)
    : 100;

  return {
    level: level.level,
    name: level.name,
    description: level.description,
    minScore: level.minScore,
    progress,
    nextLabel: level.nextLabel,
  };
}

function achievement(
  id: string,
  title: string,
  message: string,
  category: Achievement['category'],
  unlocked: boolean,
  distance: number
): Achievement {
  return {
    id,
    title,
    message,
    category,
    unlocked,
    distance: Math.max(0, Math.ceil(distance)),
  };
}

function buildAchievements(stats: GrowthStats, level: ConsciousnessLevel): Achievement[] {
  return [
    achievement('first-sprout', 'Primeiro Broto', 'Você plantou sua primeira intenção no mundo.', 'Sementes', stats.seeds >= 1, 1 - stats.seeds),
    achievement('first-root', 'Primeira Raiz', 'Toda semente precisa de sustentação. Você criou a primeira.', 'Raízes', stats.roots >= 1, 1 - stats.roots),
    achievement('first-water', 'Primeira Rega', 'Um pequeno gesto já moveu o jardim.', 'Raízes', stats.completedRoots >= 1, 1 - stats.completedRoots),
    achievement('seven-days', 'Sete Dias de Cultivo', 'Uma semana inteira. O solo está fértil.', 'Diário', stats.streak >= 7, 7 - stats.streak),
    achievement('deep-root', 'Raiz Profunda', 'Essa raiz agora sustenta algo real.', 'Raízes', stats.legendaryRoots >= 1, 1 - stats.legendaryRoots),
    achievement('three-seeds', 'Jardim Iniciado', 'Você começou a cultivar mais de uma frente da vida.', 'Sementes', stats.seeds >= 3, 3 - stats.seeds),
    achievement('thirty-entries', 'Espelho Constante', 'Trinta sinais internos registrados. Seu mapa está ficando mais nítido.', 'Diário', stats.diaryEntries >= 30, 30 - stats.diaryEntries),
    achievement('faithful-mirror', 'Espelho Fiel', 'Você tem uma escuta interior refinada.', 'Diário', stats.diaryEntries >= 50, 50 - stats.diaryEntries),
    achievement('consistent-gardener', 'Cultivador Consistente', 'Trinta regas. A repetição virou matéria.', 'Consistência', stats.completedRoots >= 30, 30 - stats.completedRoots),
    achievement('garden-guardian', 'Guardião do Jardim', 'Você não abandonou sua semente. Isso é raro.', 'Retenção', stats.activeSeeds >= 1 && stats.oldestSeedDays >= 90, Math.max(1 - stats.activeSeeds, 90 - stats.oldestSeedDays)),
    achievement('pattern-cultivator', 'Cultivador de Padrões', 'Seu jardim já tem memória.', 'Padrões', stats.activeDaysLast30 >= 18, 18 - stats.activeDaysLast30),
    achievement('weekly-reader', 'Leitor da Semana', 'Você parou para ler o próprio caminho.', 'Relatório', stats.weeklyReportsRead >= 1, 1 - stats.weeklyReportsRead),
    achievement('monthly-reader', 'Quatro Semanas de Espelho', 'Um mês inteiro olhando para os próprios sinais.', 'Relatório', stats.weeklyReportsRead >= 4, 4 - stats.weeklyReportsRead),
    achievement('forest-standing', 'Floresta em Pé', 'Você construiu algo que poucos constroem.', 'Nível', level.level >= 6, 6 - level.level),
  ];
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

async function readUnlockedAchievements(): Promise<StoredAchievementMap> {
  return readJson<StoredAchievementMap>(UNLOCKED_ACHIEVEMENTS_KEY, {});
}

async function writeUnlockedAchievements(map: StoredAchievementMap) {
  await AsyncStorage.setItem(UNLOCKED_ACHIEVEMENTS_KEY, JSON.stringify(map));
}

async function readMaxLevels(): Promise<StoredLevelMap> {
  return readJson<StoredLevelMap>(MAX_LEVEL_KEY, {});
}

async function writeMaxLevels(map: StoredLevelMap) {
  await AsyncStorage.setItem(MAX_LEVEL_KEY, JSON.stringify(map));
}

async function getWeeklyReportsRead(userId: string) {
  const reads = await readJson<StoredReportReads>(WEEKLY_REPORT_READS_KEY, {});
  return reads[userId]?.length ?? 0;
}

export async function recordWeeklyReportRead(userId: string): Promise<void> {
  const reads = await readJson<StoredReportReads>(WEEKLY_REPORT_READS_KEY, {});
  const userReads = reads[userId] ?? [];
  const weekKey = getWeekKey();
  if (!userReads.includes(weekKey)) {
    reads[userId] = [...userReads, weekKey];
    await AsyncStorage.setItem(WEEKLY_REPORT_READS_KEY, JSON.stringify(reads));
  }
}

function sortNextAchievements(a: Achievement, b: Achievement) {
  if (a.distance !== b.distance) return a.distance - b.distance;
  return ACHIEVEMENT_PRIORITY[a.category] - ACHIEVEMENT_PRIORITY[b.category];
}

export async function getGrowthProfile(userId: string): Promise<GrowthProfile> {
  const [entries, streak, seeds, weeklyReportsRead, unlockedMap, levelMap] = await Promise.all([
    getDiaryHistory(userId, 365),
    getStreak(userId),
    getSeeds(userId),
    getWeeklyReportsRead(userId),
    readUnlockedAchievements(),
    readMaxLevels(),
  ]);

  const roots = getAllRoots(seeds);
  const activeSeeds = seeds.filter(seed => seed.status !== 'harvested');
  const oldestSeedDays = seeds.reduce((max, seed) => Math.max(max, getDaysSince(seed.created_at)), 0);
  const stats: GrowthStats = {
    diaryEntries: entries.length,
    streak,
    seeds: seeds.length,
    activeSeeds: activeSeeds.length,
    roots: roots.length,
    strongRoots: roots.filter(root => (root.strength || 0) >= 80).length,
    legendaryRoots: roots.filter(root => (root.strength || 0) >= 100).length,
    completedRoots: roots.reduce((total, root) => total + (root.completed_count || 0), 0),
    weeklyReportsRead,
    oldestSeedDays,
    activeDaysLast30: getActiveDaysLast30(entries),
  };
  const score = calculateScore(stats);
  const level = buildLevel(score, stats, levelMap[userId] ?? 1);
  if ((levelMap[userId] ?? 1) < level.level) {
    await writeMaxLevels({ ...levelMap, [userId]: level.level });
  }

  const currentUnlockedIds = new Set(unlockedMap[userId] ?? []);
  const achievements = buildAchievements(stats, level);
  const triggeredAchievements = achievements.filter(item => item.unlocked);
  const newlyUnlockedAchievements = triggeredAchievements.filter(item => !currentUnlockedIds.has(item.id)).slice(0, 1);

  if (newlyUnlockedAchievements.length > 0) {
    const updatedIds = new Set([...currentUnlockedIds, ...newlyUnlockedAchievements.map(item => item.id)]);
    await writeUnlockedAchievements({ ...unlockedMap, [userId]: Array.from(updatedIds) });
  }

  const persistedUnlockedIds = new Set([
    ...currentUnlockedIds,
    ...newlyUnlockedAchievements.map(item => item.id),
  ]);
  const achievementsWithPersistence = achievements.map(item => ({
    ...item,
    unlocked: item.unlocked || persistedUnlockedIds.has(item.id),
  }));
  const unlockedAchievements = achievementsWithPersistence.filter(item => item.unlocked);
  const nextAchievement = achievementsWithPersistence
    .filter(item => !item.unlocked)
    .sort(sortNextAchievements)[0] ?? null;

  return {
    score,
    level,
    achievements: achievementsWithPersistence,
    unlockedAchievements,
    newlyUnlockedAchievements,
    nextAchievement,
    stats,
  };
}

async function readIntentions(): Promise<WeeklyIntentions> {
  return readJson<WeeklyIntentions>(WEEKLY_INTENTION_KEY, {});
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
