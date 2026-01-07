function toBffUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url;

  if (url.startsWith('/api/v1/')) {
    return '/api' + url.slice('/api/v1'.length);
  }

  if (url.startsWith('/api/')) {
    return url;
  }

  if (url.startsWith('/')) {
    return '/api' + url;
  }

  return '/api/' + url;
}

type MessageEnvelope = { message?: unknown };

function tryGetMessage(v: unknown): string | null {
  if (typeof v !== 'object' || v === null) return null;
  if (!('message' in v)) return null;

  const msg = (v as MessageEnvelope).message;
  return typeof msg === 'string' ? msg : null;
}

export async function orvalFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(toBffUrl(url), { ...init, credentials: 'include' });

  const text = await res.text().catch(() => '');
  const data: unknown = text
    ? (() => {
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return text;
        }
      })()
    : null;

  if (!res.ok) {
    const msg = tryGetMessage(data);
    const message =
      msg ?? (typeof data === 'string' ? data : `API error ${res.status}`);
    throw new Error(message);
  }

  return data as T;
}
