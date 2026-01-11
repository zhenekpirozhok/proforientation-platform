import { NextRequest } from 'next/server';
import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

    const resBody = await upstreamRes.text();

    return new Response(resBody, {
        status: upstreamRes.status,
        headers: {
            'content-type': upstreamRes.headers.get('content-type') ?? 'application/json',
        },
    });
}
