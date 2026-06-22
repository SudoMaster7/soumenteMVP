import { supabase } from '@/lib/supabase';
import { isDevUser } from '@/lib/devAuth';
import { getWeekEntries } from './diaryService';
import { getActiveSeed } from './seedService';
import { getGrowthProfile, getWeeklyIntention, type Achievement, type ConsciousnessLevel } from './growthService';
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
};

const EMOTION_LABELS: Record<EmotionType | string, string> = {
  motivated: 'Motivado',
  serene: 'Sereno',
  anxious: 'Ansioso',
  reflective: 'Reflexivo',
  joyful: 'Alegre',
  melancholic: 'Melancolico',
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
  if (registeredDays >= 6) return 'Voce esta criando uma trilha forte.';
  if (registeredDays >= 4) return 'A semana teve consistencia real.';
  if (registeredDays >= 2) return 'A semana ainda tem sinais importantes.';
  return 'Um registro ja e uma porta aberta.';
}

function buildPattern(entries: DiaryEntry[], dominantLabel: string) {
  const deepEntries = entries.filter(entry => entry.dimension === 'deep' || entry.dimension === 'transformative').length;
  if (entries.length >= 5) {
    return `Seu padrao principal foi ${dominantLabel.toLowerCase()}, mas o ponto mais forte e a repeticao: voce voltou varias vezes para se observar. Isso cria memoria emocional e reduz a chance de viver a semana no automatico.`;
  }
  if (deepEntries > 0) {
    return `Mesmo com poucos registros, houve pelo menos um momento profundo. Isso vale muito: uma percepcao bem vista pode mudar mais do que varios dias no piloto automatico.`;
  }
  return `A semana ainda parece fragmentada. O relatorio nao esta te cobrando perfeicao; ele esta mostrando onde criar um pequeno ponto de retorno.`;
}

function buildWin(registeredDays: number, rootProgress: number) {
  if (registeredDays >= 5 && rootProgress >= 50) {
    return 'Voce combinou consciencia com acao. Esse e o tipo de semana que faz uma semente ganhar corpo.';
  }
  if (registeredDays >= 3) {
    return 'Voce manteve contato consigo mesmo mais de uma vez. Isso ja e uma vitoria de continuidade.';
  }
  if (rootProgress > 0) {
    return 'Mesmo com poucos registros, alguma raiz recebeu energia. O jardim nao parou.';
  }
  return 'Voce voltou para olhar. Esse retorno e o primeiro gesto de cuidado.';
}

function buildNextAction(registeredDays: number, roots: Root[]) {
  const weakestRoot = [...roots].sort((a, b) => (a.strength || 0) - (b.strength || 0))[0];
  if (weakestRoot) {
    return `Nas proximas 24h, regue a raiz "${weakestRoot.name}" uma vez. Pequeno, claro, sem negociar com a mente.`;
  }
  if (registeredDays < 3) {
    return 'Nos proximos 3 dias, registre uma emocao por dia. Uma frase basta.';
  }
  return 'Escolha uma acao de 15 minutos que prove para voce que a semana continua em movimento.';
}

export async function generateWeeklyReport(userId: string): Promise<WeeklyReportData> {
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
        headline: 'Seu relatorio esta esperando seus primeiros sinais.',
        pattern: 'Registre pelo menos um dia no diario para revelar padroes da semana.',
        win: 'Abrir esta tela ja mostra intencao de acompanhar seu processo.',
        nextAction: 'Hoje, registre uma emocao e uma frase curta sobre o que ela esta tentando mostrar.',
        encouragement: 'Nao precisa comecar grande. Precisa comecar visivel.',
        intention,
        consciousness: growth.level,
        achievements: growth.unlockedAchievements,
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
          ? 'Voce nao precisa recomecar. Precisa proteger o ritmo que ja apareceu.'
          : 'A proxima semana nao pede culpa. Pede um ritual pequeno repetido com honestidade.',
        intention,
        consciousness: growth.level,
        achievements: growth.unlockedAchievements,
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
