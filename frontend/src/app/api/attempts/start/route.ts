import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const qs = url.search ? url.search : '';
  const upstreamPath = `/attempts/start${qs}`;

  const upstream = await bffAuthFetch(upstreamPath, {
    method: 'POST',
  });

  const text = await upstream.text();
  const headers = new Headers(upstream.headers);
  if (!headers.get('content-type')) headers.set('content-type', 'application/json');

  return new Response(text, { status: upstream.status, headers });
}
