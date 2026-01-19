import { NextRequest } from 'next/server';
import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function GET(req: NextRequest, ctx: { params: Promise<{ versionId: string }> }) {
    const { versionId } = await ctx.params;

    const upstreamPath = `/quizzes/${versionId}/traits${req.nextUrl.search}`;
    const xLocale = req.headers.get('x-locale') ?? '';

    const upstreamRes = await bffAuthFetch(upstreamPath, {
        method: 'GET',
        headers: {
            ...(xLocale ? { 'x-locale': xLocale } : {}),
        },
    });

    const resBody = await upstreamRes.text();

    return new Response(resBody, {
        status: upstreamRes.status,
        headers: {
            'content-type': upstreamRes.headers.get('content-type') ?? 'application/json',
        },
    });
}
