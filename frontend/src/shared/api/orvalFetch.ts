function toBffUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url;

  if (url.startsWith("/api/v1/")) {
    return "/api" + url.slice("/api/v1".length);
  }

  if (url.startsWith("/api/")) {
    return url;
  }

  if (url.startsWith("/")) {
    return "/api" + url;
  }

  return "/api/" + url;
}

export async function orvalFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(toBffUrl(url), {
    ...init,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `API error ${res.status}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}
