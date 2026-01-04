import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const qs = url.searchParams.toString();
    const upstream = await bffAuthFetch(qs ? `/attempts?${qs}` : '/attempts', { method: 'GET' });
    const body = await upstream.text();
    const headers = new Headers(upstream.headers);
    if (!headers.get('content-type')) headers.set('content-type', 'application/json');
    return new Response(body, { status: upstream.status, headers });
}
