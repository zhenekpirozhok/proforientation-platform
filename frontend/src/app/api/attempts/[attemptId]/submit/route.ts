import { bffFetch } from '@/shared/api/bff/proxy';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await ctx.params;

  req.headers.get('x-guest-token');

  const upstreamRes = await bffFetch(
    `/attempts/${encodeURIComponent(attemptId)}/submit`,
    { method: 'POST' },
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
