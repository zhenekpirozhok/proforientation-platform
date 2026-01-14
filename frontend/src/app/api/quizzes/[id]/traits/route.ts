import { NextRequest } from 'next/server';
import { bffFetch } from '@/shared/api/bff/proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await ctx.params;

  const upstreamPath = `/quizzes/${quizId}/traits${req.nextUrl.search}`;
  const xLocale = req.headers.get('x-locale') ?? '';

  const upstreamRes = await bffFetch(upstreamPath, {
    method: 'GET',
    headers: {
      ...(xLocale ? { 'x-locale': xLocale } : {}),
    },
  });

  const resBody = await upstreamRes.text();

  return new Response(resBody, {
    status: upstreamRes.status,
    headers: {
      'content-type': upstreamRes.headers.get('content-type') ?? 'application/json',
    },
  });
}
