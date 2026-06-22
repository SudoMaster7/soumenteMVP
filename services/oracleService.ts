import { ORACLE_PHRASES } from '@/constants/supereu';
import { useSuperEuStore } from '@/stores/superEuStore';
import type { OraclePhrase, SEFinanceEntry, SEGoal, SEHabit, SEPurchase, SEDiaryEntry } from '@/types/supereu';
import { Platform } from 'react-native';

const QWEN_API_KEY = process.env.EXPO_PUBLIC_QWEN_API_KEY ?? '';
const QWEN_API_URL = process.env.EXPO_PUBLIC_QWEN_API_URL ?? 'https://openrouter.ai/api/v1/chat/completions';
const QWEN_PROXY_URL = process.env.EXPO_PUBLIC_QWEN_PROXY_URL ?? '/api/qwen';
const QWEN_MODEL = process.env.EXPO_PUBLIC_QWEN_MODEL ?? 'qwen/qwen3-14b:free';
const CLAUDE_PROXY_URL = process.env.EXPO_PUBLIC_CLAUDE_PROXY_URL ?? '/api/claude';

type UserContext = {
  goals: SEGoal[];
  habits: SEHabit[];
  purchases: SEPurchase[];
  finance: SEFinanceEntry[];
  diary: SEDiaryEntry[];
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type GeneratedRootSuggestion = {
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'milestone';
  frequency: number;
};

function hasUsableKey(key: string) {
  return key.length > 20 && !key.includes('cole_aqui');
}

export function isPaidAiEnabled() {
  return useSuperEuStore.getState().paidAiEnabled;
}

function getQwenChatUrl() {
  const cleanUrl = QWEN_API_URL.replace(/\/$/, '');
  return cleanUrl.endsWith('/chat/completions') ? cleanUrl : `${cleanUrl}/chat/completions`;
}

function hashSeed(seed: string) {
  const value = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return value;
}

function getMockOracle(context?: UserContext, seed = new Date().toISOString()): OraclePhrase {
  const variables = buildUserVariables(context);
  const balanceTone = variables.balance >= 0 ? 'expansão' : 'ajuste';
  const ritualTone = variables.completedToday > 0 ? 'continuidade' : 'primeiro movimento';

  const messages: OraclePhrase[] = [
    {
      quote: `O dia pede ${ritualTone}: uma pequena marca abre passagem para o restante.`,
      principle: 'Lei da Causalidade',
      focus: 'Marcar o primeiro rito',
      action: `Complete 1 ritual simples e volte para marcar no painel. Hoje você está em ${variables.completedToday}/${variables.totalHabits}.`,
    },
    {
      quote: `Sua obra está em ${variables.averageGoalProgress}%. Não force o portal inteiro: empurre a próxima dobradiça.`,
      principle: 'Solve et Coagula',
      focus: 'Mover um objetivo 5%',
      action: 'Escolha um objetivo, defina uma tarefa de 15 minutos e use o +5 apenas depois de executar.',
    },
    {
      quote: `O fluxo material mostra ${balanceTone}. Dinheiro também é energia: observe para onde ele está obedecendo.`,
      principle: 'Lei da Correspondência',
      focus: 'Revisar uma saída',
      action: 'Abra Finanças e nomeie uma despesa que pode ser reduzida, adiada ou transformada em investimento.',
    },
    {
      quote: 'O que você registra deixa de ser neblina e vira mapa. O Grimório guarda a trilha do seu próprio símbolo.',
      principle: 'Daath, Conhecimento',
      focus: 'Escrever uma linha',
      action: `Registre no Grimório uma frase sobre o estado "${variables.latestDiaryMood}" e adicione uma tag sincera.`,
    },
    {
      quote: `Há ${variables.pendingPurchases} itens pendentes no plano. Nem todo desejo é prioridade; alguns são apenas ruído com bom figurino.`,
      principle: 'Lei da Polaridade',
      focus: 'Escolher uma prioridade',
      action: 'No Plano, marque um item como essencial ou remova algo que não conversa com sua fase atual.',
    },
    {
      quote: 'A magia de hoje não está em fazer muito. Está em fazer o suficiente com presença total.',
      principle: 'Tiphereth, Centro',
      focus: 'Fazer menos, melhor',
      action: 'Escolha uma única ação antes de abrir outra tela. Conclua, registre e pare por um minuto.',
    },
  ];

  return messages[hashSeed(seed) % messages.length];
}

function getFallbackOracle(seed = new Date().toISOString().slice(0, 10)): OraclePhrase {
  const base = ORACLE_PHRASES[hashSeed(seed) % ORACLE_PHRASES.length];
  return {
    ...base,
    focus: 'Voltar ao essencial',
    action: 'Escolha uma microação e registre o avanço antes de dormir.',
  };
}

function getTodayHabitIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function compactContext(context: UserContext) {
  const todayIndex = getTodayHabitIndex();
  const completedToday = context.habits.filter((habit) => habit.days[todayIndex]).length;
  const averageGoalProgress = context.goals.length
    ? Math.round(context.goals.reduce((total, goal) => total + goal.progress, 0) / context.goals.length)
    : 0;
  const pendingPurchases = context.purchases.filter((purchase) => !purchase.done);
  const balance = context.finance.reduce((total, entry) => total + entry.amount, 0);
  const latestDiary = context.diary.slice(0, 3).map((entry) => ({
    date: entry.date,
    mood: entry.mood,
    text: entry.text.slice(0, 260),
    tags: entry.tags,
  }));

  return JSON.stringify({
    today: new Date().toISOString().slice(0, 10),
    rituals: {
      total: context.habits.length,
      completedToday,
      items: context.habits.map((habit) => ({ name: habit.name, doneToday: habit.days[todayIndex], week: habit.days.filter(Boolean).length })),
    },
    goals: {
      total: context.goals.length,
      averageGoalProgress,
      items: context.goals.map((goal) => ({ title: goal.title, category: goal.category, progress: goal.progress, deadline: goal.deadline })),
    },
    plan: {
      pending: pendingPurchases.map((item) => ({ name: item.name, why: item.why, min: item.min, max: item.max, phase: item.phase })),
    },
    finance: {
      balance,
      lastEntries: context.finance.slice(0, 5).map((entry) => ({ type: entry.type, source: entry.source, amount: entry.amount, note: entry.note })),
    },
    diary: latestDiary,
  });
}

function getContextBlock(context?: UserContext) {
  if (!context) return 'Contexto do usuário: não fornecido.';
  return `Contexto do usuário em JSON compacto:\n${compactContext(context)}`;
}

function buildUserVariables(context?: UserContext) {
  if (!context) {
    return {
      completedToday: 0,
      totalHabits: 0,
      averageGoalProgress: 0,
      balance: 0,
      pendingPurchases: 0,
      latestDiaryMood: 'sem registro',
    };
  }
  const todayIndex = getTodayHabitIndex();
  const completedToday = context.habits.filter((habit) => habit.days[todayIndex]).length;
  const averageGoalProgress = context.goals.length
    ? Math.round(context.goals.reduce((total, goal) => total + goal.progress, 0) / context.goals.length)
    : 0;
  const balance = context.finance.reduce((total, entry) => total + entry.amount, 0);
  return {
    completedToday,
    totalHabits: context.habits.length,
    averageGoalProgress,
    balance,
    pendingPurchases: context.purchases.filter((purchase) => !purchase.done).length,
    latestDiaryMood: context.diary[0]?.mood ?? 'sem registro',
  };
}

async function readProviderError(res: Response) {
  try {
    const data = await res.json();
    return data?.error?.message ?? data?.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function callClaudeMessages(messages: { role: 'system' | 'user' | 'assistant'; content: string }[], maxTokens = 500): Promise<string | null> {
  const proxyUrl = CLAUDE_PROXY_URL.trim();
  if (!proxyUrl) return null;
  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_tokens: maxTokens,
        messages,
      }),
    });
    if (!res.ok) {
      const message = await readProviderError(res);
      console.warn('Claude proxy request failed', { status: res.status, message });
      return null;
    }
    const data = await res.json();
    return typeof data?.text === 'string' ? data.text.trim() : null;
  } catch {
    return null;
  }
}

async function callClaude(prompt: string, maxTokens = 300): Promise<string | null> {
  return callClaudeMessages([{ role: 'user', content: prompt }], maxTokens);
}

async function callQwen(messages: { role: 'system' | 'user' | 'assistant'; content: string }[], maxTokens = 500): Promise<string | null> {
  if (!isPaidAiEnabled()) return null;
  const useProxy = Platform.OS === 'web';
  if (!useProxy && !hasUsableKey(QWEN_API_KEY)) return null;

  try {
    const res = await fetch(useProxy ? QWEN_PROXY_URL : getQwenChatUrl(), {
      method: 'POST',
      headers: useProxy
        ? { 'Content-Type': 'application/json' }
        : {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${QWEN_API_KEY}`,
            'HTTP-Referer': 'https://soumente.app',
            'X-Title': 'SouMente',
          },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages,
        temperature: 0.75,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) {
      const message = await readProviderError(res);
      console.warn('Qwen/OpenRouter request failed', {
        status: res.status,
        model: QWEN_MODEL,
        message,
      });
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

async function callBestModel(prompt: string, maxTokens = 350): Promise<string | null> {
  const claude = await callClaude(prompt, maxTokens);
  if (claude) return claude;
  const qwen = await callQwen([{ role: 'user', content: prompt }], maxTokens);
  if (qwen) return qwen;
  return null;
}

export async function testPaidAiConnection(): Promise<string> {
  const response = await callClaudeMessages([
    {
      role: 'user',
      content: 'Responda apenas: SouMente conectado.',
    },
  ], 64);

  if (!response) {
    throw new Error('Não consegui resposta do Claude. Confira ANTHROPIC_API_KEY e /api/claude.');
  }

  return response;
}

function cleanJsonText(text: string) {
  return text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
}

function normalizeGeneratedRoots(value: unknown): GeneratedRootSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): GeneratedRootSuggestion => {
      const raw = item as Partial<GeneratedRootSuggestion>;
      const type = raw.type === 'weekly' || raw.type === 'milestone' ? raw.type : 'daily';
      return {
        name: String(raw.name || '').trim(),
        description: String(raw.description || '').trim(),
        type,
        frequency: Math.max(1, Number(raw.frequency) || 1),
      };
    })
    .filter((item) => item.name.length > 0)
    .slice(0, 5);
}

function rotateRoots(roots: GeneratedRootSuggestion[], variant = 0) {
  const offset = Math.abs(variant) % roots.length;
  return [...roots.slice(offset), ...roots.slice(0, offset)].slice(0, 3);
}

function getMockRoots(seedType?: string, variant = 0): GeneratedRootSuggestion[] {
  const base: GeneratedRootSuggestion[] = [
    {
      name: 'Ação mínima diária',
      description: 'Fazer por 10 a 15 minutos uma ação que prove movimento real.',
      type: 'daily',
      frequency: 1,
    },
    {
      name: 'Registro de aprendizado',
      description: 'Anotar o que funcionou, o que travou e qual será o próximo ajuste.',
      type: 'daily',
      frequency: 1,
    },
    {
      name: 'Revisão semanal',
      description: 'Olhar o progresso da semente e escolher uma prioridade para a semana.',
      type: 'weekly',
      frequency: 1,
    },
    {
      name: 'Bloqueio visível',
      description: 'Nomear o obstáculo mais provável do dia e escolher uma resposta simples.',
      type: 'daily',
      frequency: 1,
    },
    {
      name: 'Prova de progresso',
      description: 'Registrar uma evidência pequena de que a semente recebeu energia hoje.',
      type: 'daily',
      frequency: 1,
    },
    {
      name: 'Marco de sete dias',
      description: 'Definir um resultado observável para conquistar até a próxima semana.',
      type: 'milestone',
      frequency: 1,
    },
  ];

  if (seedType === 'finance') {
    return rotateRoots([
      { name: 'Registrar gasto principal', description: 'Nomear uma saída importante do dia e decidir se ela se repete.', type: 'daily', frequency: 1 },
      { name: 'Poupar valor pequeno', description: 'Separar um valor mínimo antes de gastar com desejos.', type: 'weekly', frequency: 1 },
      { name: 'Revisar fluxo da semana', description: 'Comparar entradas, saídas e uma escolha que pode melhorar.', type: 'weekly', frequency: 1 },
      { name: 'Cortar uma fuga', description: 'Identificar uma despesa automática que não combina com a semente.', type: 'weekly', frequency: 1 },
      { name: 'Meta de reserva', description: 'Definir um valor pequeno e claro para acumular nos próximos 7 dias.', type: 'milestone', frequency: 1 },
    ], variant);
  }

  if (seedType === 'health') {
    return rotateRoots([
      { name: 'Movimento do corpo', description: 'Fazer uma ação física simples: treino, caminhada ou alongamento.', type: 'daily', frequency: 1 },
      { name: 'Energia básica', description: 'Cuidar de água, sono ou alimentação antes de buscar intensidade.', type: 'daily', frequency: 1 },
      { name: 'Revisão de vitalidade', description: 'Perceber o que deu mais energia e repetir na próxima semana.', type: 'weekly', frequency: 1 },
      { name: 'Sono protegido', description: 'Escolher um horario limite para desacelerar e respeitar o corpo.', type: 'daily', frequency: 1 },
      { name: 'Marco de consistencia', description: 'Completar tres dias de cuidado basico antes de aumentar a carga.', type: 'milestone', frequency: 1 },
    ], variant);
  }

  return rotateRoots(base, variant);
}

export async function generateRootsWithAI(input: {
  seedName: string;
  seedType?: string;
  seedWhy?: string;
  seedForWhom?: string;
  answers: string[];
  variant?: number;
}): Promise<GeneratedRootSuggestion[]> {
  if (!isPaidAiEnabled()) return getMockRoots(input.seedType, input.variant);

  const prompt = `Você é o arquiteto de raízes do app SouMente.
Crie de 3 a 5 raízes práticas para a semente do usuário.

Semente:
- nome: ${input.seedName}
- tipo: ${input.seedType || 'custom'}
- motivo: ${input.seedWhy || 'não informado'}
- para quem: ${input.seedForWhom || 'não informado'}

Respostas de aprofundamento:
${input.answers.map((answer, index) => `${index + 1}. ${answer || 'sem resposta'}`).join('\n')}

Regras:
- Cada raiz precisa ser uma ação concreta.
- Misture raízes daily e weekly.
- Use milestone apenas se houver um marco claro.
- Nomes curtos, máximo 5 palavras.
- Descrição objetiva, máximo 120 caracteres.

Retorne APENAS JSON válido neste formato:
[
  {"name":"Nome","description":"Descrição","type":"daily","frequency":1}
]

Sem markdown, sem texto extra.`;

  const text = await callBestModel(prompt, 520);
  if (text) {
    try {
      const parsed = JSON.parse(cleanJsonText(text));
      const roots = normalizeGeneratedRoots(parsed);
      if (roots.length >= 3) return roots;
    } catch {
      // fall through to mock fallback
    }
  }

  return getMockRoots(input.seedType, input.variant);
}

export async function fetchDailyOracle(context?: UserContext, seed = new Date().toISOString().slice(0, 10)): Promise<OraclePhrase> {
  if (!isPaidAiEnabled()) return getMockOracle(context, seed);

  const todayKey = new Date().toISOString().slice(0, 10);
  const variables = buildUserVariables(context);
  const prompt = `Você é o Oráculo Diário do app SouMente.
Use as variáveis reais do usuário para gerar um foco personalizado para hoje.

Variaveis resumidas:
- rituais_hoje: ${variables.completedToday}/${variables.totalHabits}
- progresso_medio_objetivos: ${variables.averageGoalProgress}%
- saldo_financeiro: R$ ${variables.balance.toLocaleString('pt-BR')}
- compras_pendentes: ${variables.pendingPurchases}
- ultimo_estado_grimorio: ${variables.latestDiaryMood}

${getContextBlock(context)}

Retorne APENAS JSON valido neste formato exato:
{"quote":"frase meditativa de até 2 linhas","principle":"princípio hermético ou Sefirot","focus":"foco prático do dia em até 8 palavras","action":"microação concreta para as próximas 24h"}

Sem markdown, sem texto extra. Tom: sábio, esotérico, preciso e não genérico.`;

  const text = await callBestModel(prompt, 180);
  if (text) {
    try {
      const parsed = JSON.parse(cleanJsonText(text));
      if (parsed.quote && parsed.principle) return parsed as OraclePhrase;
    } catch {
      // fall through to fallback
    }
  }

  return getFallbackOracle(todayKey);
}

export async function getGoalInsight(goal: SEGoal, context?: UserContext): Promise<string> {
  if (!isPaidAiEnabled()) {
    const variables = buildUserVariables(context);
    return `Seu objetivo "${goal.title}" está em ${goal.progress}%, então o melhor movimento agora é pequeno e verificável. Ações: 1) escolha uma tarefa de 15 minutos ligada a esse objetivo; 2) conclua antes de mexer em outro plano. Seus rituais hoje estão em ${variables.completedToday}/${variables.totalHabits}, então use um ritual como gatilho de foco. Frase: a obra cresce quando a vontade vira gesto.`;
  }

  const prompt = `Você é o Mentor SouMente analisando um objetivo específico.

Objetivo em foco:
- título: ${goal.title}
- categoria: ${goal.category}
- progresso: ${goal.progress}%
- deadline: ${goal.deadline}
- prioridade: ${goal.priority}

${getContextBlock(context)}

Gere um insight em português com:
1) leitura objetiva do estado atual
2) 2 próximas ações concretas
3) uma frase meditativa hermética curta

Use rituais, finanças, plano e grimório apenas quando forem relevantes.
Max 120 palavras.`;

  const text = await callBestModel(prompt, 220);
  return text ?? 'Consulte sua intuição: o próximo passo já está tentando ficar visível.';
}

export async function getDiaryReflection(mood: string, text: string, context?: UserContext): Promise<string> {
  if (!isPaidAiEnabled()) {
    const variables = buildUserVariables(context);
    return `O estado "${mood}" aparece como matéria-prima, não como sentença. Pela Lei da Correspondência, o que você escreveu conversa com seu momento: ${variables.completedToday}/${variables.totalHabits} rituais hoje e objetivos em ${variables.averageGoalProgress}% de média. Transmutação possível: escolha um gesto físico simples agora e registre o que mudou depois dele.`;
  }

  const prompt = `Você é um oráculo hermético-kabbalistic. O usuário registrou:
Estado: ${mood}
Reflexão: "${text}"

${getContextBlock(context)}

Gere uma reflexao esoterica em 2-3 frases curtas que:
1) Valide a experiência sem ser genérico
2) Conecte com um princípio hermético ou sefirot relevante
3) Relacione com algum dado do usuário, se fizer sentido
4) Aponte uma transmutação possível

Responda em português. Tom: sábio, não clínico. Max 100 palavras.`;

  const text2 = await callBestModel(prompt, 220);
  return text2 ?? 'Sua escrita já é alquimia. Releia com outros olhos e escolha uma pequena transmutação para hoje.';
}

export async function askSouMenteMentor(question: string, context: UserContext, history: ChatMessage[] = []): Promise<string> {
  if (!isPaidAiEnabled()) {
    const variables = buildUserVariables(context);
    return `Modo mock ativado. Lendo seu mapa local: ${variables.completedToday}/${variables.totalHabits} rituais hoje, objetivos em ${variables.averageGoalProgress}% e saldo de R$ ${variables.balance.toLocaleString('pt-BR')}. Para sua pergunta "${question}", eu escolheria o menor passo que gere evidência hoje. Ação de 24h: conclua um ritual e avance +5 em um objetivo ligado a ele.`;
  }

  const system = `Você é o Mentor SouMente, um bot de autoconsciência prática.
Use os dados do usuário para dar respostas personalizadas, objetivas e motivadoras.
Tom: calmo, direto, místico na medida, sem parecer terapeuta clínico.
Regras:
- Responda em português do Brasil.
- Use no máximo 160 palavras.
- Sempre termine com uma ação pequena para as próximas 24 horas.
- Se o usuário falar de risco, crise, autoagressão ou emergência, recomende procurar ajuda humana imediata e serviços de emergência.
- Não invente dados: use apenas o contexto fornecido.`;

  const contextMessage = `Contexto atual do usuário em JSON compacto:\n${compactContext(context)}`;
  const conversation = history.slice(-6).map((message) => ({ role: message.role, content: message.content }));
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: system },
    { role: 'user', content: contextMessage },
    ...conversation,
    { role: 'user', content: question },
  ];

  const claudeAnswer = await callClaudeMessages(messages, 520);
  if (claudeAnswer) return claudeAnswer;

  const qwen = await callQwen(messages, 520);
  if (qwen) return qwen;

  const fallbackPrompt = `${system}\n\n${contextMessage}\n\nPergunta do usuário: ${question}`;
  const claude = await callClaude(fallbackPrompt, 520);
  if (claude) return claude;

  const averageGoalProgress = context.goals.length
    ? Math.round(context.goals.reduce((total, goal) => total + goal.progress, 0) / context.goals.length)
    : 0;
  const todayIndex = getTodayHabitIndex();
  const completedToday = context.habits.filter((habit) => habit.days[todayIndex]).length;
  const balance = context.finance.reduce((total, entry) => total + entry.amount, 0);

  return `Ainda estou sem conexão com o modelo, mas consigo ler seu mapa local: hoje você marcou ${completedToday}/${context.habits.length} rituais, seus objetivos estão em média com ${averageGoalProgress}% e seu saldo está em R$ ${balance.toLocaleString('pt-BR')}. A magia agora é simples: escolha um objetivo e mova apenas 5% hoje. Ação de 24h: registre uma microtarefa concreta e marque quando concluir.`;
}
