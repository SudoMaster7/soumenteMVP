export interface SEHabit {
  id: string;
  icon: string;
  name: string;
  streak: number;
  days: boolean[]; // 7 elements, Monday-Sunday
  category: 'manha' | 'tarde' | 'noite';
  time?: string; // 'HH:mm', 24h — ausente significa sem notificação configurada
}

export interface SEPurchase {
  id: string;
  phase: 'immediate' | 'week1' | 'month1' | 'month23';
  category: string;
  name: string;
  why: string;
  min: number;
  max: number;
  done: boolean;
}

export interface SEFinanceEntry {
  id: string;
  type: 'income' | 'expense';
  source: string;
  amount: number;
  date: string;
  note: string;
  timestamp?: number; // Date.now() na criação — usado para agrupar por mês
}

export const GRIMORIO_TAGS = ['insight', 'sonho', 'ideia', 'sigilo', 'reflexão'] as const;
export type GrimorioTag = (typeof GRIMORIO_TAGS)[number];

export interface SEDiaryEntry {
  id: string;
  date: string;
  mood: string;
  title?: string;
  text: string;
  tags: string[];
  aiReflection?: string;
}

export interface OraclePhrase {
  quote: string;
  principle: string;
  focus?: string;
  action?: string;
}
