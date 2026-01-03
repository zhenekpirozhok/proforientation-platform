export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
    const res = await fetch(input, { ...init, credentials: 'include' });

    if (res.status !== 401 && res.status !== 403) return res;

    const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!r.ok) return res;

    return fetch(input, { ...init, credentials: 'include' });
}
