import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const upstream = await bffAuthFetch(`/professions/search${url.search}`, {
    method: 'GET',
    headers: {
      accept: req.headers.get('accept') ?? 'application/json',
    },
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}
