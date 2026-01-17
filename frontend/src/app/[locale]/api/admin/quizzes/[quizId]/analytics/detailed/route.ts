import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { smartBffFetch } from '@/shared/api/smartBffFetch';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await ctx.params;

  const quizVersionId = req.nextUrl.searchParams.get('quizVersionId');
  if (!quizVersionId) {
    return NextResponse.json(
      { message: 'quizVersionId is required' },
      { status: 400 },
    );
  }

  const upstreamPath = `/admin/quizzes/${quizId}/analytics/detailed?quizVersionId=${encodeURIComponent(quizVersionId)}`;

  const res = await smartBffFetch(req, upstreamPath, { method: 'GET' });

  const body = await res.arrayBuffer();

  return new NextResponse(body, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  });
}
