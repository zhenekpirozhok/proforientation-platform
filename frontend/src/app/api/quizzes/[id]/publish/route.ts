import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function POST(req: any, ctx: any) {
    const upstream = await bffAuthFetch(`/quizzes/${ctx.params.id}/publish`, {
        method: 'POST',
        headers: {
            accept: req.headers.get('accept') ?? 'application/json',
        },
    });

    return new Response(upstream.body, {
        status: upstream.status,
        headers: upstream.headers,
    });
}
