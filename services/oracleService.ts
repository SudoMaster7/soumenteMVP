import { ORACLE_PHRASES } from '@/constants/supereu';
import type { OraclePhrase, SEGoal } from '@/types/supereu';
import { Platform } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? '';
const API_URL = 'https://api.anthropic.com/v1/messages';

function hasUsableApiKey() {
  return API_KEY.length > 20 && !API_KEY.includes('cole_aqui');
}

function getFallbackOracle(seed = new Date().toISOString().slice(0, 10)): OraclePhrase {
  const value = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ORACLE_PHRASES[value % ORACLE_PHRASES.length];
}

async function callClaude(prompt: string, maxTokens = 300): Promise<string | null> {
  // Anthropic should be called from a server/Edge Function in production.
  // On web, direct browser calls expose the key and usually fail CORS.
  if (Platform.OS === 'web' || !hasUsableApiKey()) return null;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

export async function fetchDailyOracle(): Promise<OraclePhrase> {
  const todayKey = new Date().toISOString().slice(0, 10);
  const prompt = `Gere UMA frase meditativa poderosa (max 2 linhas) para hoje, em portugues.
Retorne APENAS JSON valido neste formato exato:
{"quote":"frase aqui","principle":"principio hermetico ou Sefirot aqui"}
Sem markdown, sem texto extra. Tom: sabio, esoterico, nao generico.`;

  const text = await callClaude(prompt, 150);
  if (text) {
    try {
      const parsed = JSON.parse(text.trim());
      if (parsed.quote && parsed.principle) return parsed as OraclePhrase;
    } catch {
      // fall through to fallback
    }
  }

  return getFallbackOracle(todayKey);
}

export async function getGoalInsight(goal: SEGoal): Promise<string> {
  const prompt = `Objetivo: "${goal.title}" - ${goal.progress}% concluido, deadline: ${goal.deadline}.
De 2-3 proximas acoes concretas e UMA frase meditativa hermetica. Max 100 palavras. Em portugues.`;

  const text = await callClaude(prompt, 200);
  return text ?? 'Consulte sua intuicao: o proximo passo ja esta tentando ficar visivel.';
}

export async function getDiaryReflection(mood: string, text: string): Promise<string> {
  const prompt = `Voce e um oraculo hermetico-kabbalistic. O usuario registrou:
Estado: ${mood}
Reflexao: "${text}"

Gere uma reflexao esoterica em 2-3 frases curtas que:
1) Valide a experiencia sem ser generico
2) Conecte com um principio hermetico ou sefirot relevante
3) Aponte uma transmutacao possivel

Responda em portugues. Tom: sabio, nao clinico. Max 80 palavras.`;

  const text2 = await callClaude(prompt, 200);
  return text2 ?? 'Sua escrita ja e alquimia. Releia com outros olhos e escolha uma pequena transmutacao para hoje.';
}
