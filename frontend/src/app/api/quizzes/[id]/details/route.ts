import { NextResponse } from 'next/server';
import { bffFetch } from '@/shared/api/bff/proxy';

type QuizDto = { id?: number; title?: string; code?: string; status?: string };
type PageLike<T> = { content?: T[]; totalElements?: number; last?: boolean };

const AVG_SECONDS_PER_QUESTION = Number(
  process.env.QUIZ_AVG_SECONDS_PER_QUESTION ?? 8,
);

async function readJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const quizId = Number(id);

  if (!Number.isFinite(quizId)) {
    return NextResponse.json({ message: 'Invalid quiz id' }, { status: 400 });
  }

  const quizRes = await bffFetch(`/quizzes/${quizId}`, { method: 'GET' });
  const quizBody = await quizRes.text();

  if (!quizRes.ok) {
    return new NextResponse(
      quizBody || JSON.stringify({ message: 'Failed to load quiz' }),
      {
        status: quizRes.status,
        headers: { 'content-type': 'application/json' },
      },
    );
  }

  const quiz = (quizBody ? (JSON.parse(quizBody) as QuizDto) : null) ?? null;

  let questionCount: number | undefined;

  const qRes = await bffFetch(`/questions/quiz/${quizId}?page=0&size=1`, {
    method: 'GET',
  });

  if (qRes.ok) {
    const qJson = await readJson<PageLike<unknown> | unknown[]>(qRes);

    if (Array.isArray(qJson)) {
      questionCount = qJson.length;
    } else if (qJson && typeof qJson === 'object') {
      if (typeof qJson.totalElements === 'number')
        questionCount = qJson.totalElements;
      else if (Array.isArray(qJson.content))
        questionCount = qJson.content.length;
    }
  }

  if (typeof questionCount !== 'number') {
    const size = 200;
    let page = 0;
    let total = 0;

    for (let i = 0; i < 200; i++) {
      const chunkRes = await bffFetch(
        `/questions/quiz/${quizId}?page=${page}&size=${size}`,
        {
          method: 'GET',
        },
      );
      if (!chunkRes.ok) break;

      const chunk = await readJson<PageLike<unknown> | unknown[]>(chunkRes);

      if (Array.isArray(chunk)) {
        total += chunk.length;
        break;
      }

      const len = Array.isArray(chunk?.content) ? chunk.content.length : 0;
      total += len;

      if (chunk?.last === true || len === 0) break;
      page += 1;
    }

    questionCount = total;
  }

  const estimatedSeconds = Math.max(
    0,
    Math.round(questionCount * AVG_SECONDS_PER_QUESTION),
  );
  const estimatedMinutes = Math.max(0, Math.round(estimatedSeconds / 60));

  return NextResponse.json({
    id: quiz?.id ?? quizId,
    title: quiz?.title ?? '',
    code: quiz?.code,
    status: quiz?.status,
    questionCount,
    avgSecondsPerQuestion: AVG_SECONDS_PER_QUESTION,
    estimatedSeconds,
    estimatedMinutes,
  });
}
