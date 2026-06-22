import { ORACLE_PHRASES } from '@/constants/supereu';
import type { OraclePhrase, SEFinanceEntry, SEGoal, SEHabit, SEPurchase, SEDiaryEntry } from '@/types/supereu';
import { Platform } from 'react-native';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? '';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const QWEN_API_KEY = process.env.EXPO_PUBLIC_QWEN_API_KEY ?? '';
const QWEN_API_URL = process.env.EXPO_PUBLIC_QWEN_API_URL ?? 'https://openrouter.ai/api/v1/chat/completions';
const QWEN_MODEL = process.env.EXPO_PUBLIC_QWEN_MODEL ?? 'qwen/qwen3-14b:free';
const USE_MOCK_AI = (process.env.EXPO_PUBLIC_USE_MOCK_AI ?? 'true') !== 'false';

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

function hasUsableKey(key: string) {
  return key.length > 20 && !key.includes('cole_aqui');
}

function hashSeed(seed: string) {
  const value = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return value;
}

function getMockOracle(context?: UserContext, seed = new Date().toISOString()): OraclePhrase {
  const variables = buildUserVariables(context);
  const balanceTone = variables.balance >= 0 ? 'expansao' : 'ajuste';
  const ritualTone = variables.completedToday > 0 ? 'continuidade' : 'primeiro movimento';
  const goalTone = variables.averageGoalProgress >= 50 ? 'lapidacao' : 'ignicao';

  const messages: OraclePhrase[] = [
    {
      quote: `O dia pede ${ritualTone}: uma pequena marca abre passagem para o restante.`,
      principle: 'Lei da Causalidade',
      focus: 'Marcar o primeiro rito',
      action: `Complete 1 ritual simples e volte para marcar no painel. Hoje voce esta em ${variables.completedToday}/${variables.totalHabits}.`,
    },
    {
      quote: `Sua obra esta em ${variables.averageGoalProgress}%. Nao force o portal inteiro: empurre a proxima dobradica.`,
      principle: 'Solve et Coagula',
      focus: 'Mover um objetivo 5%',
      action: 'Escolha um objetivo, defina uma tarefa de 15 minutos e use o +5 apenas depois de executar.',
    },
    {
      quote: `O fluxo material mostra ${balanceTone}. Dinheiro tambem e energia: observe para onde ele esta obedecendo.`,
      principle: 'Lei da Correspondencia',
      focus: 'Revisar uma saida',
      action: 'Abra Financas e nomeie uma despesa que pode ser reduzida, adiada ou transformada em investimento.',
    },
    {
      quote: 'O que voce registra deixa de ser neblina e vira mapa. O Grimorio guarda a trilha do seu proprio simbolo.',
      principle: 'Daath, Conhecimento',
      focus: 'Escrever uma linha',
      action: `Registre no Grimorio uma frase sobre o estado "${variables.latestDiaryMood}" e adicione uma tag sincera.`,
    },
    {
      quote: `Ha ${variables.pendingPurchases} itens pendentes no plano. Nem todo desejo e prioridade; alguns sao apenas ruido com bom figurino.`,
      principle: 'Lei da Polaridade',
      focus: 'Escolher uma prioridade',
      action: 'No Plano, marque um item como essencial ou remova algo que nao conversa com sua fase atual.',
    },
    {
      quote: 'A magia de hoje nao esta em fazer muito. Esta em fazer o suficiente com presenca total.',
      principle: 'Tiphereth, Centro',
      focus: 'Fazer menos, melhor',
      action: 'Escolha uma unica acao antes de abrir outra tela. Conclua, registre e pare por um minuto.',
    },
  ];

  return messages[hashSeed(seed) % messages.length];
}

function getFallbackOracle(seed = new Date().toISOString().slice(0, 10)): OraclePhrase {
  const base = ORACLE_PHRASES[hashSeed(seed) % ORACLE_PHRASES.length];
  return {
    ...base,
    focus: 'Voltar ao essencial',
    action: 'Escolha uma microacao e registre o avanco antes de dormir.',
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
  if (!context) return 'Contexto do usuario: nao fornecido.';
  return `Contexto do usuario em JSON compacto:\n${compactContext(context)}`;
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

async function callClaude(prompt: string, maxTokens = 300): Promise<string | null> {
  // Anthropic should be called from a server/Edge Function in production.
  // On web, direct browser calls expose the key and usually fail CORS.
  if (Platform.OS === 'web' || !hasUsableKey(ANTHROPIC_API_KEY)) return null;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      console.warn('Anthropic request failed', { status: res.status });
      return null;
    }
    const data = await res.json();
    return data?.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

async function callQwen(messages: { role: 'system' | 'user' | 'assistant'; content: string }[], maxTokens = 500): Promise<string | null> {
  if (USE_MOCK_AI) return null;
  if (!hasUsableKey(QWEN_API_KEY)) return null;

  try {
    const res = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
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
  const qwen = await callQwen([{ role: 'user', content: prompt }], maxTokens);
  if (qwen) return qwen;
  return callClaude(prompt, maxTokens);
}

export async function fetchDailyOracle(context?: UserContext, seed = new Date().toISOString().slice(0, 10)): Promise<OraclePhrase> {
  if (USE_MOCK_AI) return getMockOracle(context, seed);

  const todayKey = new Date().toISOString().slice(0, 10);
  const variables = buildUserVariables(context);
  const prompt = `Voce e o Oraculo Diario do app SouMente.
Use as variaveis reais do usuario para gerar um foco personalizado para hoje.

Variaveis resumidas:
- rituais_hoje: ${variables.completedToday}/${variables.totalHabits}
- progresso_medio_objetivos: ${variables.averageGoalProgress}%
- saldo_financeiro: R$ ${variables.balance.toLocaleString('pt-BR')}
- compras_pendentes: ${variables.pendingPurchases}
- ultimo_estado_grimorio: ${variables.latestDiaryMood}

${getContextBlock(context)}

Retorne APENAS JSON valido neste formato exato:
{"quote":"frase meditativa de ate 2 linhas","principle":"principio hermetico ou Sefirot","focus":"foco pratico do dia em ate 8 palavras","action":"microacao concreta para as proximas 24h"}

Sem markdown, sem texto extra. Tom: sabio, esoterico, preciso e nao generico.`;

  const text = await callBestModel(prompt, 180);
  if (text) {
    try {
      const clean = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.quote && parsed.principle) return parsed as OraclePhrase;
    } catch {
      // fall through to fallback
    }
  }

  return getFallbackOracle(todayKey);
}

export async function getGoalInsight(goal: SEGoal, context?: UserContext): Promise<string> {
  if (USE_MOCK_AI) {
    const variables = buildUserVariables(context);
    return `Seu objetivo "${goal.title}" esta em ${goal.progress}%, entao o melhor movimento agora e pequeno e verificavel. Acoes: 1) escolha uma tarefa de 15 minutos ligada a esse objetivo; 2) conclua antes de mexer em outro plano. Seus rituais hoje estao em ${variables.completedToday}/${variables.totalHabits}, entao use um ritual como gatilho de foco. Frase: a obra cresce quando a vontade vira gesto.`;
  }

  const prompt = `Voce e o Mentor SouMente analisando um objetivo especifico.

Objetivo em foco:
- titulo: ${goal.title}
- categoria: ${goal.category}
- progresso: ${goal.progress}%
- deadline: ${goal.deadline}
- prioridade: ${goal.priority}

${getContextBlock(context)}

Gere um insight em portugues com:
1) leitura objetiva do estado atual
2) 2 proximas acoes concretas
3) uma frase meditativa hermetica curta

Use rituais, financas, plano e grimorio apenas quando forem relevantes.
Max 120 palavras.`;

  const text = await callBestModel(prompt, 220);
  return text ?? 'Consulte sua intuicao: o proximo passo ja esta tentando ficar visivel.';
}

export async function getDiaryReflection(mood: string, text: string, context?: UserContext): Promise<string> {
  if (USE_MOCK_AI) {
    const variables = buildUserVariables(context);
    return `O estado "${mood}" aparece como materia-prima, nao como sentenca. Pela Lei da Correspondencia, o que voce escreveu conversa com seu momento: ${variables.completedToday}/${variables.totalHabits} rituais hoje e objetivos em ${variables.averageGoalProgress}% de media. Transmutacao possivel: escolha um gesto fisico simples agora e registre o que mudou depois dele.`;
  }

  const prompt = `Voce e um oraculo hermetico-kabbalistic. O usuario registrou:
Estado: ${mood}
Reflexao: "${text}"

${getContextBlock(context)}

Gere uma reflexao esoterica em 2-3 frases curtas que:
1) Valide a experiencia sem ser generico
2) Conecte com um principio hermetico ou sefirot relevante
3) Relacione com algum dado do usuario, se fizer sentido
4) Aponte uma transmutacao possivel

Responda em portugues. Tom: sabio, nao clinico. Max 100 palavras.`;

  const text2 = await callBestModel(prompt, 220);
  return text2 ?? 'Sua escrita ja e alquimia. Releia com outros olhos e escolha uma pequena transmutacao para hoje.';
}

export async function askSouMenteMentor(question: string, context: UserContext, history: ChatMessage[] = []): Promise<string> {
  if (USE_MOCK_AI) {
    const variables = buildUserVariables(context);
    return `Modo mock ativado. Lendo seu mapa local: ${variables.completedToday}/${variables.totalHabits} rituais hoje, objetivos em ${variables.averageGoalProgress}% e saldo de R$ ${variables.balance.toLocaleString('pt-BR')}. Para sua pergunta "${question}", eu escolheria o menor passo que gere evidencia hoje. Acao de 24h: conclua um ritual e avance +5 em um objetivo ligado a ele.`;
  }

  const system = `Voce e o Mentor SouMente, um bot de autoconsciencia pratica.
Use os dados do usuario para dar respostas personalizadas, objetivas e motivadoras.
Tom: calmo, direto, mistico na medida, sem parecer terapeuta clinico.
Regras:
- Responda em portugues do Brasil.
- Use no maximo 160 palavras.
- Sempre termine com uma acao pequena para as proximas 24 horas.
- Se o usuario falar de risco, crise, autoagressao ou emergencia, recomende procurar ajuda humana imediata e servicos de emergencia.
- Nao invente dados: use apenas o contexto fornecido.`;

  const contextMessage = `Contexto atual do usuario em JSON compacto:\n${compactContext(context)}`;
  const conversation = history.slice(-6).map((message) => ({ role: message.role, content: message.content }));
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: system },
    { role: 'user', content: contextMessage },
    ...conversation,
    { role: 'user', content: question },
  ];

  const qwen = await callQwen(messages, 520);
  if (qwen) return qwen;

  const fallbackPrompt = `${system}\n\n${contextMessage}\n\nPergunta do usuario: ${question}`;
  const claude = await callClaude(fallbackPrompt, 520);
  if (claude) return claude;

  const averageGoalProgress = context.goals.length
    ? Math.round(context.goals.reduce((total, goal) => total + goal.progress, 0) / context.goals.length)
    : 0;
  const todayIndex = getTodayHabitIndex();
  const completedToday = context.habits.filter((habit) => habit.days[todayIndex]).length;
  const balance = context.finance.reduce((total, entry) => total + entry.amount, 0);

  return `Ainda estou sem conexao com o modelo, mas consigo ler seu mapa local: hoje voce marcou ${completedToday}/${context.habits.length} rituais, seus objetivos estao em media com ${averageGoalProgress}% e seu saldo esta em R$ ${balance.toLocaleString('pt-BR')}. A magia agora e simples: escolha um objetivo e mova apenas 5% hoje. Acao de 24h: registre uma microtarefa concreta e marque quando concluir.`;
}
