import { bffFetch } from '@/shared/api/bff/proxy';
import { cookies } from 'next/headers';
import type { LoginResponse } from '@/shared/api/generated/model';

export async function POST() {
    const c = await cookies();
    const refresh = c.get('cp_refresh')?.value;

    if (!refresh) {
        return new Response(JSON.stringify({ message: 'No refresh token' }), {
            status: 401,
            headers: { 'content-type': 'application/json' },
        });
    }

    const upstreamRes = await bffFetch('/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: decodeURIComponent(refresh) }),
    });

    const text = await upstreamRes.text();

    if (!upstreamRes.ok) {
        return new Response(text, { status: upstreamRes.status, headers: upstreamRes.headers });
    }

    let data: LoginResponse;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = {};
    }

    const { token, refreshToken, expiresIn } = data;

    if (!token || !refreshToken) {
        return new Response(JSON.stringify({ message: 'Invalid refresh response' }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }

    const headers = new Headers();
    headers.set('content-type', 'application/json');

    const isProd = process.env.NODE_ENV === 'production';
    const secure = isProd ? 'Secure; ' : '';
    const sameSite = 'SameSite=Lax; ';
    const path = 'Path=/; ';
    const httpOnly = 'HttpOnly; ';

    const accessMaxAge = Math.max(60, Math.floor((expiresIn ?? 1800000) / 1000));
    const refreshMaxAge = 60 * 60 * 24 * 30;

    headers.append(
        'set-cookie',
        `cp_access=${encodeURIComponent(token)}; ${httpOnly}${secure}${sameSite}${path}Max-Age=${accessMaxAge}`,
    );
    headers.append(
        'set-cookie',
        `cp_refresh=${encodeURIComponent(refreshToken)}; ${httpOnly}${secure}${sameSite}${path}Max-Age=${refreshMaxAge}`,
    );

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
