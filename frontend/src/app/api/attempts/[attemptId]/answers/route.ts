import { bffFetch } from '@/shared/api/bff/proxy';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await ctx.params;

  const body = await req.text();

  const guestToken = req.headers.get('x-guest-token') ?? '';
  const locale = req.headers.get('x-locale') ?? '';

  const upstreamRes = await bffFetch(
    `/attempts/${encodeURIComponent(attemptId)}/answers`,
    {
      method: 'POST',
      headers: {
        'content-type': req.headers.get('content-type') ?? 'application/json',
        ...(guestToken ? { 'x-guest-token': guestToken } : {}),
        ...(locale ? { 'x-locale': locale } : {}),
      },
      body,
    },
  );

  const upstreamBody = await upstreamRes.text();

  return new Response(upstreamBody, {
    status: upstreamRes.status,
    headers: {
      'content-type':
        upstreamRes.headers.get('content-type') ?? 'application/json',
    },
  });
}
