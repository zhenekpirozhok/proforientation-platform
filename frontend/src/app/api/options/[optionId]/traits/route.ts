import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function POST(req: any, ctx: any) {
    const body = await req.text();

    const raw = ctx?.params?.optionId;
    const optionId = raw !== undefined && raw !== null ? String(raw) : undefined;

    if (!optionId) {
        return new Response(JSON.stringify({ code: 400, message: 'Invalid value for parameter "optionId": undefined' }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
        });
    }

    const upstream = await bffAuthFetch(`/options/${optionId}/traits`, {
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
