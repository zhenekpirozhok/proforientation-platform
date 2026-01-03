export async function POST() {
    const headers = new Headers();
    headers.set('content-type', 'application/json');

    const isProd = process.env.NODE_ENV === 'production';
    const secure = isProd ? 'Secure; ' : '';
    const sameSite = 'SameSite=Lax; ';
    const path = 'Path=/; ';
    const httpOnly = 'HttpOnly; ';

    headers.append('set-cookie', `cp_access=; ${httpOnly}${secure}${sameSite}${path}Max-Age=0`);
    headers.append('set-cookie', `cp_refresh=; ${httpOnly}${secure}${sameSite}${path}Max-Age=0`);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
