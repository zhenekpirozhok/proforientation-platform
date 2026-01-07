import type { NextRequest } from 'next/server';
import { bffFetch } from '@/shared/api/bff/proxy';
import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

type SmartFetchInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

function pickLocale(req: NextRequest) {
  return req.headers.get('x-locale') ?? undefined;
}

function pickGuestToken(req: NextRequest) {
  return (
    req.headers.get('x-guest-token') ??
    req.headers.get('guest-token') ??
    undefined
  );
}

export async function smartBffFetch(
  req: NextRequest,
  upstreamPath: string,
  init: SmartFetchInit,
) {
  const locale = pickLocale(req);
  const guestToken = pickGuestToken(req);

  const headers: Record<string, string> = {
    ...(init.headers ?? {}),
  };

  if (locale) headers['x-locale'] = locale;

  const authed = await bffAuthFetch(upstreamPath, {
    ...init,
    headers,
  });

  if (authed.status !== 401 && authed.status !== 403) return authed;

  const guestHeaders: Record<string, string> = { ...headers };
  if (guestToken) guestHeaders['x-guest-token'] = guestToken;

  return bffFetch(upstreamPath, {
    ...init,
    headers: guestHeaders,
  });
}
