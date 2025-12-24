import { headers, cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL) throw new Error('BACKEND_URL is not defined');

const FORWARD_HEADERS = new Set([
  'authorization',
  'cookie',
  'accept-language',
  'user-agent',
  'x-locale',
  'x-request-id',
  'x-guest-token',
]);

export async function bffFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
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

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: { ...safeHeaders, ...initHeaders },
    cache: 'no-store',
  });
}
