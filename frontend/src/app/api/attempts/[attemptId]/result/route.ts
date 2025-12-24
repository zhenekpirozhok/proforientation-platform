import { bffFetch } from '@/shared/api/bff/proxy';

export async function GET(
  _: Request,
  ctx: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await ctx.params;

  const upstreamRes = await bffFetch(
    `/attempts/${encodeURIComponent(attemptId)}/result`,
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
