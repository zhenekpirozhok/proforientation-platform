import { NextRequest } from 'next/server';
import { bffFetch } from '@/shared/api/bff/proxy';
import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.search;
  const upstreamPath = `/categories${search}`;

  const xLocale = req.headers.get('x-locale') ?? '';

  const upstreamRes = await bffFetch(upstreamPath, {
    method: 'GET',
    headers: {
      ...(xLocale ? { 'x-locale': xLocale } : {}),
    },
  });

  const body = await upstreamRes.text();

  return new Response(body, {
    status: upstreamRes.status,
    headers: {
      'content-type':
        upstreamRes.headers.get('content-type') ?? 'application/json',
    },
  });
}

export async function POST(req: Request) {
  const body = await req.text();

  const upstream = await bffAuthFetch('/categories', {
    method: 'POST',
    headers: {
      'content-type': req.headers.get('content-type') ?? 'application/json',
      accept: req.headers.get('accept') ?? 'application/json',
    },
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}
