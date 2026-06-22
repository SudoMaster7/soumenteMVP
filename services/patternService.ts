import { getDiaryHistory, getStreak } from './diaryService';
import { getSeeds } from './seedService';
import type { DiaryEntry, EmotionType, Root, Seed } from '@/types';

export type PatternInsight = {
  id: string;
  title: string;
  text: string;
  kind: 'emotion' | 'consistency' | 'seed' | 'time' | 'risk';
  confidence: 'cultivando' | 'inicial' | 'forte';
};

export type PatternMap = {
  ready: boolean;
  presenceScore: number;
  totalEntries: number;
  activeDays: number;
  requiredDays: number;
  headline: string;
  summary: string;
  insights: PatternInsight[];
};

const EMOTION_LABELS: Record<EmotionType | string, string> = {
  motivated: 'motivacao',
  serene: 'serenidade',
  anxious: 'ansiedade',
  reflective: 'reflexao',
  joyful: 'alegria',
  melancholic: 'melancolia',
};

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function uniqueDays(entries: DiaryEntry[]) {
  return new Set(entries.map(entry => entry.entry_date)).size;
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function topEntry(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
}

function getAllRoots(seeds: Seed[]): Root[] {
  return seeds.flatMap(seed => seed.roots ?? []);
}

function getRecentEntries(entries: DiaryEntry[], days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceKey = getLocalDateString(since);
  return entries.filter(entry => entry.entry_date >= sinceKey);
}

function getWeekdayName(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', { weekday: 'long' });
}

function buildEarlyInsights(entries: DiaryEntry[], seeds: Seed[], streak: number): PatternInsight[] {
  const roots = getAllRoots(seeds);
  const strongestRoot = [...roots].sort((a, b) => (b.strength || 0) - (a.strength || 0))[0];
  const latestEntry = entries[0];

  return [
    {
      id: 'early-presence',
      title: 'Primeiro sinal',
      text: latestEntry
        ? `Seu ultimo registro trouxe ${EMOTION_LABELS[latestEntry.emotion_primary] ?? 'um estado interno'} para a superficie. O mapa ainda esta formando memoria, mas ja existe um ponto de retorno.`
        : 'O mapa ainda esta em branco. O primeiro registro emocional cria o ponto zero da sua jornada.',
      kind: 'emotion',
      confidence: 'cultivando',
    },
    {
      id: 'early-streak',
      title: 'Continuidade',
      text: streak > 0
        ? `Voce tem ${streak} dia(s) de sequencia. O proximo padrao nasce quando esse retorno vira repeticao.`
        : 'Ainda nao existe sequencia ativa. Voltar amanha sera o primeiro padrao positivo detectavel.',
      kind: 'consistency',
      confidence: 'cultivando',
    },
    {
      id: 'early-root',
      title: 'Raiz observada',
      text: strongestRoot
        ? `A raiz "${strongestRoot.name}" e a mais forte agora, com ${strongestRoot.strength || 0}% de forca. Continue regando para o sistema entender seu ritmo.`
        : 'Plante uma semente e regue uma raiz para o mapa conectar intencao com acao.',
      kind: 'seed',
      confidence: 'cultivando',
    },
  ];
}

function buildReadyInsights(entries: DiaryEntry[], seeds: Seed[], streak: number): PatternInsight[] {
  const recentEntries = getRecentEntries(entries, 30);
  const emotionTop = topEntry(countBy(recentEntries.map(entry => entry.emotion_primary)));
  const weekdayTop = topEntry(countBy(recentEntries.map(entry => getWeekdayName(entry.entry_date))));
  const roots = getAllRoots(seeds);
  const strongestRoot = [...roots].sort((a, b) => (b.strength || 0) - (a.strength || 0))[0];
  const weakestRoot = [...roots].filter(root => (root.completed_count || 0) > 0 || (root.strength || 0) > 0).sort((a, b) => (a.strength || 0) - (b.strength || 0))[0];
  const activeSeeds = seeds.filter(seed => seed.status !== 'harvested');
  const neglectedSeed = [...activeSeeds].sort((a, b) => {
    const aProgress = (a.roots ?? []).reduce((total, root) => total + (root.strength || 0), 0);
    const bProgress = (b.roots ?? []).reduce((total, root) => total + (root.strength || 0), 0);
    return aProgress - bProgress;
  })[0];

  const insights: PatternInsight[] = [];

  if (emotionTop) {
    const [emotion, count] = emotionTop;
    insights.push({
      id: 'dominant-emotion',
      title: 'Emocao recorrente',
      text: `Nos ultimos registros, ${EMOTION_LABELS[emotion] ?? emotion} apareceu ${count} vez(es). Esse estado parece ser uma chave importante para entender seu momento atual.`,
      kind: 'emotion',
      confidence: count >= 5 ? 'forte' : 'inicial',
    });
  }

  if (weekdayTop) {
    const [weekday, count] = weekdayTop;
    insights.push({
      id: 'best-day',
      title: 'Dia com mais presenca',
      text: `${weekday} apareceu como seu dia com mais registros recentes (${count}). Vale observar o que esse dia tem de diferente na sua rotina.`,
      kind: 'time',
      confidence: count >= 4 ? 'forte' : 'inicial',
    });
  }

  insights.push({
    id: 'streak-risk',
    title: streak >= 7 ? 'Ritmo protegido' : 'Ponto de risco',
    text: streak >= 7
      ? `Sua sequencia de ${streak} dias ja virou um ativo. Proteja o horario ou ritual que tornou isso possivel.`
      : 'Seu mapa mostra uma oportunidade simples: criar uma sequencia curta de 3 dias antes de tentar mudar tudo.',
    kind: streak >= 7 ? 'consistency' : 'risk',
    confidence: streak >= 7 ? 'forte' : 'inicial',
  });

  if (strongestRoot) {
    insights.push({
      id: 'strong-root',
      title: 'Raiz que sustenta',
      text: `A raiz "${strongestRoot.name}" e a mais forte agora (${strongestRoot.strength || 0}%). Ela pode virar gatilho para outras acoes menores.`,
      kind: 'seed',
      confidence: (strongestRoot.strength || 0) >= 70 ? 'forte' : 'inicial',
    });
  }

  if (weakestRoot && weakestRoot.id !== strongestRoot?.id) {
    insights.push({
      id: 'weak-root',
      title: 'Raiz em risco',
      text: `A raiz "${weakestRoot.name}" esta com ${weakestRoot.strength || 0}%. Uma unica rega nesta semana ja muda a leitura do seu jardim.`,
      kind: 'risk',
      confidence: 'inicial',
    });
  }

  if (neglectedSeed) {
    insights.push({
      id: 'neglected-seed',
      title: 'Semente silenciosa',
      text: `A semente "${neglectedSeed.name}" parece receber menos energia que as outras. Talvez ela precise de uma raiz mais facil para voltar ao ciclo.`,
      kind: 'seed',
      confidence: activeSeeds.length >= 2 ? 'forte' : 'inicial',
    });
  }

  return insights.slice(0, 6);
}

export async function getPatternMap(userId: string): Promise<PatternMap> {
  const [entries, seeds, streak] = await Promise.all([
    getDiaryHistory(userId, 120),
    getSeeds(userId),
    getStreak(userId),
  ]);
  const recentEntries = getRecentEntries(entries, 30);
  const activeDays = uniqueDays(recentEntries);
  const presenceScore = Math.min(100, Math.round((activeDays / 30) * 100));
  const ready = activeDays >= 18;

  return {
    ready,
    presenceScore,
    totalEntries: entries.length,
    activeDays,
    requiredDays: 18,
    headline: ready ? 'Seu jardim ja revela padroes.' : 'Seu mapa esta criando memoria.',
    summary: ready
      ? 'As descobertas abaixo cruzam registros emocionais, dias de presenca, sementes e raizes para sugerir onde existe energia ou risco.'
      : `Faltam ${Math.max(0, 18 - activeDays)} dia(s) ativos para liberar uma leitura mais confiavel. Enquanto isso, estes sao sinais iniciais.`,
    insights: ready
      ? buildReadyInsights(entries, seeds, streak)
      : buildEarlyInsights(entries, seeds, streak),
  };
}
