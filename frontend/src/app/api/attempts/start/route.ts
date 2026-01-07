import { NextRequest } from 'next/server';
import { smartBffFetch } from '@/shared/api/bff/smartBffFetch';

export async function POST(req: NextRequest) {
  const search = req.nextUrl.search;
  const upstreamPath = `/attempts/start${search}`;

  const upstreamRes = await smartBffFetch(req, upstreamPath, { method: 'POST' });
  const body = await upstreamRes.text();

  const headers = new Headers(upstreamRes.headers);
  if (!headers.get('content-type')) headers.set('content-type', 'application/json');

  return new Response(body, {
    status: upstreamRes.status,
    headers,
  });
}
