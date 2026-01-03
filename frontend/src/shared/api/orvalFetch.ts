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

export async function orvalFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(toBffUrl(url), { ...init, credentials: "include" });

  const text = await res.text().catch(() => "");
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data && typeof (data as any).message === "string"
        ? (data as any).message
        : typeof data === "string" ? data : `API error ${res.status}`;
    throw new Error(message);
  }

  return (data as T);
}
