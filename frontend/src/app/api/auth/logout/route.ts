import { bffAuthFetch } from '@/shared/api/bffAuthFetch';
import { cookies } from 'next/headers';

export async function POST() {
  const upstreamRes = await bffAuthFetch('/auth/logout', { method: 'POST' });
  const body = await upstreamRes.text().catch(() => '');

  const headers = new Headers();
  headers.set(
    'content-type',
    upstreamRes.headers.get('content-type') ?? 'application/json',
  );

  if (upstreamRes.ok) {
    const isProd = process.env.NODE_ENV === 'production';
    const secure = isProd ? 'Secure; ' : '';
    const sameSite = 'SameSite=Lax; ';
    const path = 'Path=/; ';
    const httpOnly = 'HttpOnly; ';

    headers.append(
      'set-cookie',
      `cp_access=; ${httpOnly}${secure}${sameSite}${path}Max-Age=0`,
    );
    headers.append(
      'set-cookie',
      `cp_refresh=; ${httpOnly}${secure}${sameSite}${path}Max-Age=0`,
    );

    const c = await cookies();
    c.delete('cp_access');
    c.delete('cp_refresh');
  }

  return new Response(body || JSON.stringify({ ok: upstreamRes.ok }), {
    status: upstreamRes.status,
    headers,
  });
}
