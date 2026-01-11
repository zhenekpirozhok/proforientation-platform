import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function POST(req: Request) {
    const body = await req.text();

    const upstream = await bffAuthFetch('/traits', {
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
