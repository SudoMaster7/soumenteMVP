import { supabase } from '@/lib/supabase';
import { isDevUser } from '@/lib/devAuth';
import { getWeekEntries } from './diaryService';
import { getActiveSeed } from './seedService';
import { getGrowthProfile, getWeeklyIntention, recordWeeklyReportRead, type Achievement, type ConsciousnessLevel } from './growthService';
import type { DiaryEntry, EmotionType, Root } from '@/types';

export type WeeklyReportData = {
  isEmpty: boolean;
  weekStart?: string;
  weekEnd?: string;
  registeredDays: number;
  consistencyScore: number;
  dominantEmotion: {
    id: string;
    label: string;
    count: number;
  };
  seed: {
    name: string;
    status: string;
    rootProgress: number;
    roots: {
      name: string;
      count: number;
      strength: number;
    }[];
  } | null;
  headline: string;
  pattern: string;
  win: string;
  nextAction: string;
  encouragement: string;
  intention: string;
  consciousness: ConsciousnessLevel;
  achievements: Achievement[];
  newlyUnlockedAchievements: Achievement[];
  nextAchievement: Achievement | null;
};

const EMOTION_LABELS: Record<EmotionType | string, string> = {
  motivated: 'Motivado',
  serene: 'Sereno',
  anxious: 'Ansioso',
  reflective: 'Reflexivo',
  joyful: 'Alegre',
  melancholic: 'Melancólico',
};

function countEmotions(entries: DiaryEntry[]) {
  const emotionCount: Record<string, number> = {};
  entries.forEach(entry => {
    emotionCount[entry.emotion_primary] = (emotionCount[entry.emotion_primary] || 0) + 1;
  });
  const [id = 'variada', count = 0] = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0] ?? [];
  return {
    id,
    count,
    label: EMOTION_LABELS[id] ?? 'Variada',
  };
}

function getRootProgress(roots: Root[]) {
  if (roots.length === 0) return 0;
  return Math.round(roots.reduce((total, root) => total + (root.strength || 0), 0) / roots.length);
}

function buildHeadline(registeredDays: number) {
  if (registeredDays >= 6) return 'Você está criando uma trilha forte.';
  if (registeredDays >= 4) return 'A semana teve consistência real.';
  if (registeredDays >= 2) return 'A semana ainda tem sinais importantes.';
  return 'Um registro já é uma porta aberta.';
}

function buildPattern(entries: DiaryEntry[], dominantLabel: string) {
  const deepEntries = entries.filter(entry => entry.dimension === 'deep' || entry.dimension === 'transformative').length;
  if (entries.length >= 5) {
    return `Seu padrão principal foi ${dominantLabel.toLowerCase()}, mas o ponto mais forte é a repetição: você voltou várias vezes para se observar. Isso cria memória emocional e reduz a chance de viver a semana no automático.`;
  }
  if (deepEntries > 0) {
    return `Mesmo com poucos registros, houve pelo menos um momento profundo. Isso vale muito: uma percepção bem vista pode mudar mais do que vários dias no piloto automático.`;
  }
  return `A semana ainda parece fragmentada. O relatório não está te cobrando perfeição; ele está mostrando onde criar um pequeno ponto de retorno.`;
}

function buildWin(registeredDays: number, rootProgress: number) {
  if (registeredDays >= 5 && rootProgress >= 50) {
    return 'Você combinou consciência com ação. Esse é o tipo de semana que faz uma semente ganhar corpo.';
  }
  if (registeredDays >= 3) {
    return 'Você manteve contato consigo mesmo mais de uma vez. Isso já é uma vitória de continuidade.';
  }
  if (rootProgress > 0) {
    return 'Mesmo com poucos registros, alguma raiz recebeu energia. O jardim não parou.';
  }
  return 'Você voltou para olhar. Esse retorno é o primeiro gesto de cuidado.';
}

function buildNextAction(registeredDays: number, roots: Root[]) {
  const weakestRoot = [...roots].sort((a, b) => (a.strength || 0) - (b.strength || 0))[0];
  if (weakestRoot) {
    return `Nas próximas 24h, regue a raiz "${weakestRoot.name}" uma vez. Pequeno, claro, sem negociar com a mente.`;
  }
  if (registeredDays < 3) {
    return 'Nos próximos 3 dias, registre uma emoção por dia. Uma frase basta.';
  }
  return 'Escolha uma ação de 15 minutos que prove para você que a semana continua em movimento.';
}

export async function generateWeeklyReport(userId: string): Promise<WeeklyReportData> {
  await recordWeeklyReportRead(userId);

  const [entries, seed] = await Promise.all([
    getWeekEntries(userId),
    getActiveSeed(userId),
  ]);
  const [growth, intention] = await Promise.all([
    getGrowthProfile(userId),
    getWeeklyIntention(userId),
  ]);

  const weekStart = entries[0]?.entry_date;
  const weekEnd = entries[entries.length - 1]?.entry_date;
  const dominant = countEmotions(entries);
  const roots = seed?.roots || [];
  const rootProgress = getRootProgress(roots);
  const registeredDays = entries.length;
  const consistencyScore = Math.round((registeredDays / 7) * 100);

  const report: WeeklyReportData = entries.length === 0
    ? {
        isEmpty: true,
        registeredDays: 0,
        consistencyScore: 0,
        dominantEmotion: { id: 'variada', label: 'Sem dados', count: 0 },
        seed: seed
          ? {
              name: seed.name,
              status: seed.status,
              rootProgress,
              roots: roots.map(root => ({
                name: root.name,
                count: root.completed_count || 0,
                strength: root.strength || 0,
              })),
            }
          : null,
        headline: 'Seu relatório está esperando seus primeiros sinais.',
        pattern: 'Registre pelo menos um dia no diário para revelar padrões da semana.',
        win: 'Abrir esta tela já mostra intenção de acompanhar seu processo.',
        nextAction: 'Hoje, registre uma emoção e uma frase curta sobre o que ela está tentando mostrar.',
        encouragement: 'Não precisa começar grande. Precisa começar visível.',
        intention,
        consciousness: growth.level,
        achievements: growth.unlockedAchievements,
        newlyUnlockedAchievements: growth.newlyUnlockedAchievements,
        nextAchievement: growth.nextAchievement,
      }
    : {
        isEmpty: false,
        weekStart,
        weekEnd,
        registeredDays,
        consistencyScore,
        dominantEmotion: dominant,
        seed: seed
          ? {
              name: seed.name,
              status: seed.status,
              rootProgress,
              roots: roots.map(root => ({
                name: root.name,
                count: root.completed_count || 0,
                strength: root.strength || 0,
              })),
            }
          : null,
        headline: buildHeadline(registeredDays),
        pattern: buildPattern(entries, dominant.label),
        win: buildWin(registeredDays, rootProgress),
        nextAction: buildNextAction(registeredDays, roots),
        encouragement: registeredDays >= 5
          ? 'Você não precisa recomeçar. Precisa proteger o ritmo que já apareceu.'
          : 'A próxima semana não pede culpa. Pede um ritual pequeno repetido com honestidade.',
        intention,
        consciousness: growth.level,
        achievements: growth.unlockedAchievements,
        newlyUnlockedAchievements: growth.newlyUnlockedAchievements,
        nextAchievement: growth.nextAchievement,
      };

  if (!isDevUser(userId)) {
    await supabase.from('ai_reports').insert({
      user_id: userId,
      week_start: weekStart,
      week_end: weekEnd,
      pattern_analysis: JSON.stringify(report),
      dominant_emotion: dominant.id,
      recommendations: report.nextAction,
      generated_at: new Date().toISOString(),
    });
  }

  return report;
}
