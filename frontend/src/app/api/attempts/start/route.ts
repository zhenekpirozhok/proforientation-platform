import { NextRequest } from 'next/server';
import { bffFetch } from '@/shared/api/bff/proxy';

export async function POST(req: NextRequest) {
  const search = req.nextUrl.search;
  const upstreamPath = `/attempts/start${search}`;

  const upstreamRes = await bffFetch(upstreamPath, { method: 'POST' });
  const body = await upstreamRes.text();

  return new Response(body, {
    status: upstreamRes.status,
    headers: {
      'content-type':
        upstreamRes.headers.get('content-type') ?? 'application/json',
    },
  });
}
