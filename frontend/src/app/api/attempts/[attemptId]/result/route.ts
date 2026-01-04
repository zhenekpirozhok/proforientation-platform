import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

function parseAttemptIdFromPath(pathname: string) {
  const m = pathname.match(/^\/api\/attempts\/(\d+)\/result\/?$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = parseAttemptIdFromPath(url.pathname);

  if (!id) {
    return new Response(JSON.stringify({ message: 'Invalid attempt id' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const upstream = await bffAuthFetch(`/attempts/${id}/result`, { method: 'GET' });
  const body = await upstream.text();

  const headers = new Headers(upstream.headers);
  if (!headers.get('content-type')) headers.set('content-type', 'application/json');

  return new Response(body, { status: upstream.status, headers });
}
