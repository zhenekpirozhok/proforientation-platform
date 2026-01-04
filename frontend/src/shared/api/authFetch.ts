import { HttpError } from '@/shared/api/httpError';

export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
    const res = await fetch(input, { ...init, credentials: 'include' });

    if (res.status !== 401 && res.status !== 403) return res;

    const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!r.ok) throw new HttpError(res.status, 'Forbidden');

    const res2 = await fetch(input, { ...init, credentials: 'include' });
    if (res2.status === 401 || res2.status === 403) throw new HttpError(res2.status, 'Forbidden');

    return res2;
}
