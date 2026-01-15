import { NextResponse } from 'next/server';
import { bffFetch } from '@/shared/api/bff/proxy';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const quizId = Number(id);
  if (!Number.isFinite(quizId) || quizId <= 0 || id === 'new') {
    return NextResponse.json(null, { status: 200 });
  }

  const res = await bffFetch(`/quizzes/${id}/versions/current`, {
    method: 'GET',
  });
  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  });
}
