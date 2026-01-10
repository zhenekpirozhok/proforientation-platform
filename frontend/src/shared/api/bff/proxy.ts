import { headers, cookies } from 'next/headers';

const FORWARD_HEADERS = new Set([
  'authorization',
  'cookie',
  'accept-language',
  'user-agent',
  'x-locale',
  'x-request-id',
  'x-guest-token',
]);

function getBackendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) throw new Error('BACKEND_URL is not defined');
  return url;
}

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function stripLeadingApi(p: string) {
  if (p.startsWith('/api/v1.0/')) return p.slice('/api/v1.0'.length);
  if (p.startsWith('/api/v1/')) return p.slice('/api/v1'.length);
  if (p.startsWith('/api/')) return p.slice('/api'.length);
  return p;
}

function isMetricsPath(p: string) {
  return p.startsWith('/quizzes/metrics') || p.startsWith('/metrics');
}

function toUpstreamPath(path: string) {
  const raw = normalizePath(path);

  if (raw.startsWith('/api/v1.0/api/v1/')) return raw;
  if (raw.startsWith('/api/v1.0/')) {
    const rest = raw.slice('/api/v1.0'.length);
    if (isMetricsPath(rest)) return `/api/v1.0/api/v1${rest}`;
    return raw;
  }

  const rest = stripLeadingApi(raw);
  if (isMetricsPath(rest)) return `/api/v1.0/api/v1${rest}`;
  return `/api/v1.0${rest}`;
}

export async function bffFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const backendUrl = getBackendUrl();

  const h = await headers();
  const c = await cookies();

  const xLocale = h.get('x-locale')?.trim();
  const cookieLocale = c.get('NEXT_LOCALE')?.value?.trim();
  const acceptLanguage = h.get('accept-language')?.trim();
  const locale = xLocale || cookieLocale || acceptLanguage?.split(',')[0];

  const safeHeaders: Record<string, string> = {};
  for (const [k, v] of h.entries()) {
    const key = k.toLowerCase();
    if (FORWARD_HEADERS.has(key)) safeHeaders[key] = v;
  }

  if (locale) safeHeaders['accept-language'] = locale;

  const initHeaders = init.headers
    ? Object.fromEntries(new Headers(init.headers).entries())
    : {};

  const upstreamPath = toUpstreamPath(path);
  const url = new URL(upstreamPath, backendUrl).toString();

  return fetch(url, {
    ...init,
    headers: { ...safeHeaders, ...initHeaders },
    cache: 'no-store',
  });
}
