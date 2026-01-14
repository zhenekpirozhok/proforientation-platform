import { NextRequest } from 'next/server';
import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function GET(req: NextRequest) {
    const search = req.nextUrl.search;
    const upstreamPath = `/quizzes/my${search}`;

    const upstreamRes = await bffAuthFetch(upstreamPath, { method: 'GET' });

    const body = await upstreamRes.text();

    return new Response(body, {
        status: upstreamRes.status,
        headers: {
            'content-type':
                upstreamRes.headers.get('content-type') ?? 'application/json',
        },
    });
}
