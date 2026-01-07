import { bffFetch } from '@/shared/api/bff/proxy';

export async function POST(req: Request) {
  const body = await req.text();

  const upstream = await bffFetch('/auth/reset-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });

  const text = await upstream.text();
  const headers = new Headers(upstream.headers);
  if (!headers.get('content-type'))
    headers.set('content-type', 'application/json');

  return new Response(text, { status: upstream.status, headers });
}
