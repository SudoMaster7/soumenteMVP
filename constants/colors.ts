export const colors = {
  // Fundos
  bg:        '#0A0906',
  surface:   '#141210',
  surface2:  '#1C1915',
  surface3:  '#241E18',

  // Marca
  gold:      '#C4A882',
  goldDim:   'rgba(196,168,130,0.4)',
  goldGlow:  'rgba(196,168,130,0.08)',

  // Texto
  cream:     '#F0E8D8',
  creamDim:  'rgba(240,232,216,0.5)',
  muted:     '#6A6258',

  // Semânticas
  green:     '#4A7A5A',
  blue:      '#3A5A7A',
  red:       '#A04030',
  orange:    '#A06030',

  // Semente por tipo
  seedColors: {
    dream:        '#C4A882', // dourado
    career:       '#3A5A7A', // azul
    health:       '#4A7A5A', // verde
    relationship: '#A06030', // laranja
    finance:      '#6A4A8A', // roxo
    custom:       '#6A6258', // cinza
  },

  // Emoções
  emotionColors: {
    motivated:   '#C4A882',
    serene:      '#4A7A5A',
    anxious:     '#A04030',
    reflective:  '#3A5A7A',
    joyful:      '#DDB870',
    melancholic: '#6A4A8A',
  },
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radius = {
  sm: 8, md: 14, lg: 20, full: 100,
} as const;

export const fonts = {
  display: 'BebasNeue',
  body:    'Outfit',
  serif:   'DMSerifDisplay',
} as const;