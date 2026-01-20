import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function POST(req: Request) {
  const body = await req.text();

  const upstream = await bffAuthFetch('/questions', {
    method: 'POST',
    headers: {
      'content-type': req.headers.get('content-type') ?? 'application/json',
      accept: req.headers.get('accept') ?? 'application/json',
    },
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing id' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const upstream = await bffAuthFetch(`/questions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      accept: req.headers.get('accept') ?? 'application/json',
    },
  });

  const body = await upstream.text();

  return new Response(body, {
    status: upstream.status,
    headers: {
      'content-type':
        upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}
