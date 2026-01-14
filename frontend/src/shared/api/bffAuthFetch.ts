import { bffFetch } from '@/shared/api/bff/proxy';
import { cookies, headers as nextHeaders } from 'next/headers';

function decode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

async function getAccessFromCookies() {
  const c = await cookies();
  const access = c.get('cp_access')?.value ?? null;
  return access ? decode(access) : null;
}

export async function bffAuthFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  const access = await getAccessFromCookies();
  if (access) headers.set('authorization', `Bearer ${access}`);

  const first = await bffFetch(path, { ...init, headers });

  if (first.status !== 401 && first.status !== 403) return first;

  let refreshRes: Response;
  if (typeof nextHeaders === 'function') {
    const h = await nextHeaders();
    const host = h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'http';
    const origin = host ? `${proto}://${host}` : undefined;

    const refreshUrl = origin ? new URL('/api/auth/refresh', origin).toString() : '/api/auth/refresh';

    refreshRes = await fetch(refreshUrl, {
      method: 'POST',
      headers: { cookie: h.get('cookie') ?? '' },
    });
  } else {
    refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
  }
  if (!refreshRes.ok) return first;

  const access2 = await getAccessFromCookies();
  if (!access2) return first;

  const headers2 = new Headers(init.headers);
  headers2.set('authorization', `Bearer ${access2}`);

  return bffFetch(path, { ...init, headers: headers2 });
}
