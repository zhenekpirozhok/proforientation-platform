import { bffFetch } from '@/shared/api/bff/proxy';
import { cookies } from 'next/headers';

async function getAuthHeaders() {
    const c = await cookies();
    const access = c.get('cp_access')?.value;
    const h = new Headers();
    if (access) h.set('authorization', `Bearer ${decodeURIComponent(access)}`);
    return h;
}

export async function bffAuthFetch(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    const authHeaders = await getAuthHeaders();
    authHeaders.forEach((v, k) => headers.set(k, v));

    const first = await bffFetch(path, { ...init, headers });

    if (first.status !== 401 && first.status !== 403) return first;

    const refreshRes = await bffFetch('/auth/refresh', { method: 'POST' });
    if (!refreshRes.ok) return first;

    const headers2 = new Headers(init.headers);
    const authHeaders2 = await getAuthHeaders();
    authHeaders2.forEach((v, k) => headers2.set(k, v));

    return bffFetch(path, { ...init, headers: headers2 });
}
