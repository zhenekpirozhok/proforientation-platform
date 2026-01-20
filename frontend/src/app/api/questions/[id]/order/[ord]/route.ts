import { NextRequest } from 'next/server';
import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; ord: string }> },
) {
  const { id, ord } = await ctx.params;

  const upstreamRes = await bffAuthFetch(
    `/questions/${encodeURIComponent(id)}/order/${encodeURIComponent(ord)}`,
    {
      method: 'PUT',
      headers: {
        accept: req.headers.get('accept') ?? 'application/json',
        'content-type': req.headers.get('content-type') ?? 'application/json',
      },
      body: await req.text(),
    },
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
