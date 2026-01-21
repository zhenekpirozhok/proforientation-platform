import { NextRequest } from 'next/server';
import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function GET(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
) {
    const { id } = await ctx.params;

    const upstreamPath = `/professions/${encodeURIComponent(id)}${req.nextUrl.search}`;
    const xLocale = req.headers.get('x-locale') ?? '';

    const upstreamRes = await bffAuthFetch(upstreamPath, {
        method: 'GET',
        headers: {
            accept: req.headers.get('accept') ?? 'application/json',
            ...(xLocale ? { 'x-locale': xLocale } : {}),
        },
    });

    const resBody = await upstreamRes.text();

    return new Response(resBody, {
        status: upstreamRes.status,
        headers: {
            'content-type':
                upstreamRes.headers.get('content-type') ?? 'application/json',
        },
    });
}
