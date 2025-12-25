import { NextRequest } from 'next/server';
import { bffFetch } from '@/shared/api/bff/proxy';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await ctx.params;

  const url = req.nextUrl;

  const headerLocale = req.headers.get('x-locale') || '';
  const queryLocale = url.searchParams.get('locale') || '';
  const locale = (queryLocale || headerLocale || '').trim();

  if (locale) url.searchParams.set('locale', locale);

  const upstreamRes = await bffFetch(
    `/questions/quiz/${encodeURIComponent(quizId)}?${url.searchParams.toString()}`,
    { method: 'GET' },
  );

  const body = await upstreamRes.text();

  return new Response(body, {
    status: upstreamRes.status,
    headers: {
      'content-type':
        upstreamRes.headers.get('content-type') ?? 'application/json',
    },
  });
}
