import { NextRequest } from 'next/server';
import { bffFetch } from '@/shared/api/bff/proxy';

function joinPath(parts: string[]) {
  return parts.map(encodeURIComponent).join('/');
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await ctx.params;

  const search = req.nextUrl.search;
  const upstreamPath = path.length
    ? `/quizzes/${joinPath(path)}${search}`
    : `/quizzes${search}`;

  const upstreamRes = await bffFetch(upstreamPath, { method: 'GET' });
  const body = await upstreamRes.text();

  return new Response(body, {
    status: upstreamRes.status,
    headers: {
      'content-type':
        upstreamRes.headers.get('content-type') ?? 'application/json',
    },
  });
}
