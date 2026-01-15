import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function POST(req: any, ctx: any) {
    const raw = ctx?.params?.id;
    const id = raw !== undefined && raw !== null ? String(raw) : undefined;

    if (!id || Number.isNaN(Number(id))) {
        return new Response(JSON.stringify({ code: 400, message: 'Invalid value for parameter "id": ' + String(raw) }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
        });
    }

    const upstream = await bffAuthFetch(`/quizzes/${id}/versions`, {
        method: 'POST',
        headers: {
            'content-type': req.headers.get('content-type') ?? 'application/json',
            accept: req.headers.get('accept') ?? 'application/json',
        },
        body: await req.text(),
    });

    return new Response(upstream.body, {
        status: upstream.status,
        headers: upstream.headers,
    });
}
