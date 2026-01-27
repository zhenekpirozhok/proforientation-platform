import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { smartBffFetchStrict } from '@/shared/api/smartBffFetch';

const ALLOWED = new Set([
  'overview.csv',
  'detailed.csv',
  'overview.xlsx',
  'detailed.xlsx',
]);

function contentTypeFor(file: string) {
  if (file.endsWith('.csv')) return 'text/csv; charset=utf-8';
  if (file.endsWith('.xlsx'))
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return 'application/octet-stream';
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ quizId: string; file: string }> },
) {
  const { quizId, file } = await ctx.params;

  if (!ALLOWED.has(file)) {
    return NextResponse.json(
      { message: 'Invalid export file' },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const quizVersionId = url.searchParams.get('quizVersionId');
  if (!quizVersionId) {
    return NextResponse.json(
      { message: 'quizVersionId is required' },
      { status: 400 },
    );
  }

  // backend paths are:
  // /admin/quizzes/{quizId}/analytics/export/overview.csv?quizVersionId=...
  const upstreamPath = `/admin/quizzes/${quizId}/analytics/export/${file}?quizVersionId=${encodeURIComponent(
    quizVersionId,
  )}`;

  const res = await smartBffFetchStrict(req, upstreamPath, { method: 'GET' });

  // pass through downloadable headers
  const headers = new Headers();
  headers.set(
    'content-type',
    res.headers.get('content-type') ?? contentTypeFor(file),
  );

  const cd = res.headers.get('content-disposition');
  if (cd) headers.set('content-disposition', cd);
  else headers.set('content-disposition', `attachment; filename="${file}"`);

  return new NextResponse(res.body, { status: res.status, headers });
}
