import { NextRequest, NextResponse } from 'next/server';
import { smartBffFetch } from '@/shared/api/smartBffFetch';

export const dynamic = 'force-dynamic';

async function proxy(req: NextRequest, path: string[]) {
  const qs = req.nextUrl.search; // includes leading "?"
  const upstreamPath = `/${path.join('/')}${qs}`;

  const res = await smartBffFetch(req, upstreamPath, {
    method: req.method,
    body:
      req.method === 'GET' || req.method === 'HEAD'
        ? undefined
        : await req.arrayBuffer(),
  });

  const body = await res.arrayBuffer();

  return new NextResponse(body, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
