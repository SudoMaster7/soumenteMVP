type ClaudeRole = 'user' | 'assistant' | 'system';

type ClaudeInputMessage = {
  role: ClaudeRole;
  content: string;
};

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MAX_PROMPT_CHARS = 18000;

export const aiCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeMessages(body: Record<string, unknown>) {
  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = rawMessages
    .map((message): ClaudeInputMessage | null => {
      if (!message || typeof message !== 'object') return null;
      const record = message as Record<string, unknown>;
      const role = record.role;
      const content = asString(record.content).slice(0, MAX_PROMPT_CHARS);
      if ((role === 'user' || role === 'assistant' || role === 'system') && content.trim()) {
        return { role, content };
      }
      return null;
    })
    .filter((message): message is ClaudeInputMessage => Boolean(message));

  const prompt = asString(body.prompt).slice(0, MAX_PROMPT_CHARS);
  if (!messages.length && prompt.trim()) {
    messages.push({ role: 'user', content: prompt });
  }

  return messages.slice(-12);
}

async function readProviderError(response: Response) {
  try {
    const data = await response.json();
    return data?.error?.message ?? data?.message ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

export async function callAnthropicFromServer(body: Record<string, unknown>) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      status: 500,
      body: { error: 'ANTHROPIC_API_KEY não configurada no servidor.' },
    };
  }

  const messages = normalizeMessages(body);
  if (!messages.length) {
    return {
      status: 400,
      body: { error: 'Envie prompt ou messages para gerar uma resposta.' },
    };
  }

  const systemFromBody = asString(body.system).trim();
  const systemFromMessages = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n')
    .trim();
  const system = systemFromBody || systemFromMessages || undefined;
  const cleanMessages = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }));

  const maxTokens = Math.min(Math.max(Number(body.max_tokens) || 500, 64), 2048);
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: cleanMessages,
      }),
    });

    if (!response.ok) {
      const message = await readProviderError(response);
      return {
        status: response.status,
        body: { error: message },
      };
    }

    const data = await response.json();
    const text = Array.isArray(data?.content)
      ? data.content
          .filter((item: unknown) => item && typeof item === 'object' && (item as { type?: string }).type === 'text')
          .map((item: unknown) => (item as { text?: string }).text || '')
          .join('')
          .trim()
      : '';

    return {
      status: 200,
      body: { text, model },
    };
  } catch (error) {
    console.error('Claude proxy failed', error);
    return {
      status: 500,
      body: { error: 'Falha ao chamar Claude.' },
    };
  }
}
