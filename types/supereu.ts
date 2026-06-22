export interface SEHabit {
  id: string;
  icon: string;
  name: string;
  streak: number;
  days: boolean[]; // 7 elements, Mon–Sun
}

export interface SEGoal {
  id: string;
  title: string;
  category: 'Produto' | 'Negócio' | 'Corpo' | 'Finanças' | 'Espiritual' | 'Relacionamentos';
  deadline: string; // YYYY-MM-DD
  progress: number; // 0–100
  priority: 'high' | 'medium' | 'low';
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
}

export interface SEDiaryEntry {
  id: string;
  date: string;
  mood: string; // emoji
  text: string;
  tags: string[];
  aiReflection?: string;
}

export interface OraclePhrase {
  quote: string;
  principle: string;
}

export type SuperEuModule = 'oracle' | 'mentor' | 'rituais' | 'objetivos' | 'plano' | 'financas' | 'grimorio';
