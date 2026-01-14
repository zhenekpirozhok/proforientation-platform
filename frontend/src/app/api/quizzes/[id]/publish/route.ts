import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function POST(req: Request, { params }: { params: { id?: string } }) {
    let id = params?.id;

    if (!id) {
        try {
            const u = new URL((req as Request).url);
            const m = u.pathname.match(/\/api\/quizzes\/(\d+)\/publish\/?$/);
            if (m && m[1]) id = m[1];
        } catch {
            // ignore
        }
    }

    const upstream = await bffAuthFetch(`/quizzes/${id}/publish`, {
        method: 'POST',
        headers: {
            accept: (req as Request).headers.get('accept') ?? 'application/json',
        },
    });

    return new Response(upstream.body, {
        status: upstream.status,
        headers: upstream.headers,
    });
}
