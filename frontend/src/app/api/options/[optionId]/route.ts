import { NextRequest } from 'next/server';
import { bffFetch } from '@/shared/api/bff/proxy';
import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ optionId: string }> },
) {
  const { optionId } = await ctx.params;

  const upstreamRes = await bffFetch(
    `/options/${encodeURIComponent(optionId)}${req.nextUrl.search}`,
    {
      method: 'GET',
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

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ optionId: string }> },
) {
  const { optionId } = await ctx.params;
  const body = await req.text();

  const upstreamRes = await bffAuthFetch(
    `/options/${encodeURIComponent(optionId)}`,
    {
      method: 'PUT',
      headers: {
        'content-type': req.headers.get('content-type') ?? 'application/json',
        accept: req.headers.get('accept') ?? 'application/json',
      },
      body,
    },
  );

  const resBody = await upstreamRes.text();

  return new Response(resBody, {
    status: upstreamRes.status,
    headers: {
      'content-type':
        upstreamRes.headers.get('content-type') ?? 'application/json',
    },
  });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ optionId: string }> },
) {
  const { optionId } = await ctx.params;

  const upstreamRes = await bffAuthFetch(
    `/options/${encodeURIComponent(optionId)}`,
    {
      method: 'DELETE',
      headers: {
        accept: req.headers.get('accept') ?? 'application/json',
      },
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
