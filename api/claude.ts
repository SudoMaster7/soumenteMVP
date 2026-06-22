import { aiCorsHeaders, callAnthropicFromServer } from '../lib/anthropicProxy';

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  end: () => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(aiCorsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
  const result = await callAnthropicFromServer(body);
  res.status(result.status).json(result.body);
}
