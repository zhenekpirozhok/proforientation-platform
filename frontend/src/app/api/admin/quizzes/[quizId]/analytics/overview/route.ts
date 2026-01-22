import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { smartBffFetch } from '@/shared/api/smartBffFetch';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await ctx.params;

  const url = new URL(req.url);
  const quizVersionId = url.searchParams.get('quizVersionId');
  if (!quizVersionId) {
    return NextResponse.json(
      { message: 'quizVersionId is required' },
      { status: 400 },
    );
  }

  const qs = new URLSearchParams();
  qs.set('quizVersionId', quizVersionId);

  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);

  const upstreamPath = `/admin/quizzes/${quizId}/analytics/overview?${qs.toString()}`;

  const res = await smartBffFetch(req, upstreamPath, { method: 'GET' });

  return new NextResponse(res.body, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  });
}
