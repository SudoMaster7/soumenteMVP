import type { SEHabit, SEGoal, SEPurchase, SEFinanceEntry, OraclePhrase, SuperEuModule } from '@/types/supereu';

// Paleta visual do Super Eu.
export const SE = {
  void: '#060608',
  obsidian: '#0A0A0F',
  surface: '#111118',
  surface2: '#16161F',
  surface3: '#1C1C27',
  gold: '#C8A84B',
  goldLight: '#E2C97E',
  goldDim: 'rgba(200,168,75,0.35)',
  goldGlow: 'rgba(200,168,75,0.12)',
  goldBorder: 'rgba(180,150,80,0.18)',
  violet: '#6B3FA0',
  violet2: '#8B5CC8',
  violetDim: 'rgba(107,63,160,0.25)',
  ivory: '#F5F0E8',
  muted: 'rgba(245,240,232,0.45)',
  muted2: 'rgba(245,240,232,0.22)',
  success: '#4B9C8A',
  danger: '#C84B4B',
} as const;

export const SE_FONTS = {
  display: 'Cinzel_700Bold',
  displayReg: 'Cinzel_400Regular',
  body: 'CormorantGaramond_400Regular',
  bodyItalic: 'CormorantGaramond_400Regular_Italic',
  mono: 'DMMono_400Regular',
} as const;

export const SE_TABS: { id: SuperEuModule; label: string; symbol: string }[] = [
  { id: 'oracle', label: 'Oráculo', symbol: '◆' },
  { id: 'mentor', label: 'Mentor', symbol: 'AI' },
  { id: 'padroes', label: 'Padrões', symbol: 'MAP' },
  { id: 'rituais', label: 'Rituais', symbol: '🔥' },
  { id: 'objetivos', label: 'Objetivos', symbol: '◇' },
  { id: 'plano', label: 'Plano', symbol: '△' },
  { id: 'financas', label: 'Finanças', symbol: '$' },
  { id: 'grimorio', label: 'Grimório', symbol: '📖' },
];

export const ORACLE_PHRASES: OraclePhrase[] = [
  { quote: 'O que resiste persiste. O que você evita te ensina.', principle: 'Lei da Polaridade · Hermetismo' },
  { quote: 'Cada ação que você toma agora é a oração do futuro que você quer.', principle: 'Lei da Causalidade · Kybalion' },
  { quote: 'O silêncio entre dois pensamentos: ali mora o Super Eu.', principle: 'Tiphareth · Árvore da Vida' },
  { quote: 'Não é o que acontece, mas o que você faz com o que acontece.', principle: 'Lei do Mentalismo · Hermetismo' },
  { quote: 'Cada hábito é um voto que você faz para si mesmo.', principle: 'Yesod · Fundação · Kabbalah' },
  { quote: 'Dissolva o que não serve. Coagule o que é essencial.', principle: 'Solve et Coagula · Alquimia' },
  { quote: 'Sua consistência atual é a prova do seu caráter futuro.', principle: 'Lei da Vibração · Kybalion' },
  { quote: 'O espelho não mente. Olhe com coragem.', principle: 'Da\'at · Conhecimento · Kabbalah' },
];

export const SE_MOODS = [
  { emoji: '😶', label: 'Neutro' },
  { emoji: '🌪️', label: 'Confuso' },
  { emoji: '✨', label: 'Iluminado' },
  { emoji: '💫', label: 'Fluindo' },
  { emoji: '🔥', label: 'Em chamas' },
  { emoji: '🌑', label: 'Na sombra' },
  { emoji: '⚡', label: 'Intenso' },
  { emoji: '🌿', label: 'Em paz' },
];

export const DEFAULT_HABITS: SEHabit[] = [
  { id: '1', icon: '🧘', name: 'Meditação', streak: 0, days: [false, false, false, false, false, false, false] },
  { id: '2', icon: '📖', name: 'Journaling', streak: 0, days: [false, false, false, false, false, false, false] },
  { id: '3', icon: '🚿', name: 'Banho frio', streak: 0, days: [false, false, false, false, false, false, false] },
  { id: '4', icon: '💪', name: 'Academia', streak: 0, days: [false, false, false, false, false, false, false] },
  { id: '5', icon: '📚', name: 'Estudo', streak: 0, days: [false, false, false, false, false, false, false] },
  { id: '6', icon: '💻', name: 'Programação', streak: 0, days: [false, false, false, false, false, false, false] },
];

export const DEFAULT_GOALS: SEGoal[] = [
  { id: '1', title: 'Lançar SouMente v1', category: 'Produto', deadline: '2026-08-01', progress: 40, priority: 'high' },
  { id: '2', title: 'Cliente internacional', category: 'Negócio', deadline: '2026-09-30', progress: 15, priority: 'medium' },
  { id: '3', title: 'Academia 3x semana', category: 'Corpo', deadline: '2026-12-31', progress: 60, priority: 'medium' },
];

export const DEFAULT_PURCHASES: SEPurchase[] = [
  { id: '1', phase: 'immediate', category: 'Corpo', name: 'Whey Protein', why: 'Energia para treinos', min: 120, max: 180, done: false },
  { id: '2', phase: 'immediate', category: 'Digital', name: 'Domínio soumente.com.br', why: 'Identidade do produto', min: 40, max: 60, done: false },
  { id: '3', phase: 'week1', category: 'Casa', name: 'Mesa de escritório', why: 'Ambiente de foco profundo', min: 500, max: 900, done: false },
  { id: '4', phase: 'month1', category: 'Digital', name: 'Apple Developer', why: 'Publicar no App Store', min: 550, max: 550, done: false },
];

export const DEFAULT_FINANCE: SEFinanceEntry[] = [
  { id: '1', type: 'income', source: 'SUDO / Freelance', amount: 3500, date: '01 Jun 2026', note: 'Projeto identidade visual' },
  { id: '2', type: 'expense', source: 'Moradia', amount: -1200, date: '05 Jun 2026', note: 'Aluguel' },
];

export const fmtBRL = (n: number) =>
  `R$ ${Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export const todayHermetic = () => {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const PHASE_LABEL: Record<SEPurchase['phase'], string> = {
  immediate: 'Imediato',
  week1: 'Semana 1',
  month1: 'Mês 1',
  month23: 'Meses 2-3',
};

export const PHASE_COLOR: Record<SEPurchase['phase'], string> = {
  immediate: '#C8A84B',
  week1: '#8B5CC8',
  month1: '#4B9C8A',
  month23: 'rgba(245,240,232,0.35)',
};
