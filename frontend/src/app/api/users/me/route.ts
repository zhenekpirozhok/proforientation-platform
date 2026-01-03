import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function GET() {
    const upstreamRes = await bffAuthFetch('/users/me', { method: 'GET' });

    const text = await upstreamRes.text();

    if (!upstreamRes.ok) {
        return new Response(text, { status: upstreamRes.status, headers: upstreamRes.headers });
    }

    let data: any = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }

    if (data && typeof data === 'object') {
        delete data.password;
        delete data.passwordHash;
    }

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'content-type': 'application/json' },
    });
}
