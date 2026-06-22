import { aiCorsHeaders, callAnthropicFromServer } from '@/lib/anthropicProxy';

export function OPTIONS() {
  return new Response(null, { headers: aiCorsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await callAnthropicFromServer(body);
    return Response.json(result.body, {
      status: result.status,
      headers: aiCorsHeaders,
    });
  } catch {
    return Response.json(
      { error: 'JSON inválido.' },
      { status: 400, headers: aiCorsHeaders }
    );
  }
}
