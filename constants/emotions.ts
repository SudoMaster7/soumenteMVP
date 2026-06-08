export const EMOTIONS = [
  { id: 'motivated',   label: 'Motivado',    emoji: '🔥', color: '#C4A882' },
  { id: 'serene',      label: 'Sereno',      emoji: '😌', color: '#4A7A5A' },
  { id: 'anxious',     label: 'Ansioso',     emoji: '😰', color: '#A04030' },
  { id: 'reflective',  label: 'Reflexivo',   emoji: '🌊', color: '#3A5A7A' },
  { id: 'joyful',      label: 'Alegre',      emoji: '😄', color: '#DDB870' },
  { id: 'melancholic', label: 'Melancólico', emoji: '😔', color: '#6A4A8A' },
] as const;

export const DIMENSIONS = [
  { id: 'subtle',         label: 'Sutil',         icon: '🌱', desc: 'Pequena percepção' },
  { id: 'medium',         label: 'Médio',          icon: '🌿', desc: 'Evento relevante'  },
  { id: 'deep',           label: 'Profundo',       icon: '🌳', desc: 'Mudou algo em mim' },
  { id: 'transformative', label: 'Transformador',  icon: '🌪️', desc: 'Vou lembrar sempre' },
] as const;

export const SEED_TYPES = [
  { id: 'dream',        label: 'Sonho',          icon: '✨', examples: ['Viajar o mundo', 'Ser livre'] },
  { id: 'career',       label: 'Carreira',       icon: '🚀', examples: ['Abrir empresa', 'Mudar de área'] },
  { id: 'health',       label: 'Saúde',          icon: '💪', examples: ['Emagrecer 10kg', 'Meditar todo dia'] },
  { id: 'relationship', label: 'Relacionamentos', icon: '❤️', examples: ['Melhorar comunicação', 'Encontrar um amor'] },
  { id: 'finance',      label: 'Finanças',       icon: '💰', examples: ['Sair das dívidas', 'Investir'] },
  { id: 'custom',       label: 'Outro',          icon: '🌱', examples: ['O que você quiser'] },
] as const;