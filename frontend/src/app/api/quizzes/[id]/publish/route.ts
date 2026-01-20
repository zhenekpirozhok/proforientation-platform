import { NextRequest } from 'next/server';
import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  let id: string | undefined;

  try {
    const p = await ctx.params;
    id = p?.id;
  } catch {
    // ignore
  }

  if (!id) {
    try {
      const u = new URL(req.url);
      const m = u.pathname.match(/\/api\/quizzes\/(\d+)\/publish\/?$/);
      if (m && m[1]) id = m[1];
    } catch {
      // ignore
    }
  }

  const upstream = await bffAuthFetch(`/quizzes/${id}/publish`, {
    method: 'POST',
    headers: {
      accept: req.headers.get('accept') ?? 'application/json',
    },
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}
