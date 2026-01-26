import { NextRequest } from 'next/server';
import { bffFetch } from '@/shared/api/bff/proxy';
import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const upstreamPath = `/quizzes/${id}${req.nextUrl.search}`;
  const xLocale = req.headers.get('x-locale') ?? '';

  const upstreamRes = await bffFetch(upstreamPath, {
    method: 'GET',
    headers: {
      ...(xLocale ? { 'x-locale': xLocale } : {}),
    },
  });

  if (upstreamRes.status === 204) {
    return new Response(null, {
      status: 204,
      headers: {
        'content-type':
          upstreamRes.headers.get('content-type') ?? 'application/json',
      },
    });
  }

  const resBody = await upstreamRes.text();

  return new Response(resBody, {
    status: upstreamRes.status,
    headers: {
      'content-type':
        upstreamRes.headers.get('content-type') ?? 'application/json',
    },
  });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const upstreamPath = `/quizzes/${id}`;
  const xLocale = req.headers.get('x-locale') ?? '';
  const body = await req.text();

  const upstreamRes = await bffAuthFetch(upstreamPath, {
    method: 'PUT',
    headers: {
      'content-type': req.headers.get('content-type') ?? 'application/json',
      ...(xLocale ? { 'x-locale': xLocale } : {}),
    },
    body,
  });

  if (upstreamRes.status === 204) {
    return new Response(null, {
      status: 204,
      headers: {
        'content-type':
          upstreamRes.headers.get('content-type') ?? 'application/json',
      },
    });
  }

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
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  try {
    const upstreamRes = await bffAuthFetch(`/quizzes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        accept: req.headers.get('accept') ?? 'application/json',
      },
    });

    if (upstreamRes.status === 204) {
      return new Response(null, {
        status: 204,
        headers: {
          'content-type':
            upstreamRes.headers.get('content-type') ?? 'application/json',
        },
      });
    }

    const body = await upstreamRes.text();

    // Some upstream responses (e.g. 204 No Content) must not include a body
    if (upstreamRes.status === 204 || body.length === 0) {
      return new Response(null, { status: upstreamRes.status });
    }

    return new Response(body, {
      status: upstreamRes.status,
      headers: {
        'content-type':
          upstreamRes.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (err) {
    // If the upstream call fails (network error, backend down, etc.), return a 502
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ message: 'Bad gateway', detail: msg }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
