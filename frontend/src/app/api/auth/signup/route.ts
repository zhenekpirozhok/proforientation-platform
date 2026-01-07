import { bffFetch } from '@/shared/api/bff/proxy';

export async function POST(req: Request) {
  const body = await req.text();

  const upstreamRes = await bffFetch('/auth/signup', {
    method: 'POST',
    headers: {
      'content-type': req.headers.get('content-type') ?? 'application/json',
    },
    body,
  });

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: upstreamRes.headers,
  });
}
