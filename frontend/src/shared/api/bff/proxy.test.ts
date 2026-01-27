jest.mock('next/headers', () => ({
  headers: jest.fn(),
  cookies: jest.fn(),
}));

import { headers as nextHeaders, cookies as nextCookies } from 'next/headers';
import { bffFetch } from './proxy';

type MockHeadersInit = Record<string, string>;

function makeHeaders(init: MockHeadersInit) {
  return new Headers(init);
}

function makeNextHeaders(init: MockHeadersInit) {
  const h = makeHeaders(init);
  return {
    get: (k: string) => h.get(k),
    entries: () => h.entries(),
  };
}

function makeNextCookies(init: Record<string, string>) {
  return {
    get: (name: string) => {
      if (!(name in init)) return undefined;
      return { value: init[name] };
    },
  };
}

describe('bffFetch', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, BACKEND_URL: 'https://backend.example' };

    const fetchMock = jest.fn<
      Promise<Response>,
      [input: RequestInfo | URL, init?: RequestInit]
    >(async () => ({ ok: true, status: 200 }) as unknown as Response);

    globalThis.fetch = fetchMock;

    (nextHeaders as jest.Mock).mockResolvedValue(
      makeNextHeaders({
        'x-request-id': 'rid',
        'user-agent': 'ua',
        authorization: 'Bearer abc',
        'accept-language': 'en-US,en;q=0.9',
        'x-locale': '',
        cookie: 'a=b',
        'x-guest-token': 'gt',
        'x-not-forwarded': 'nope',
      }),
    );

    (nextCookies as jest.Mock).mockResolvedValue(
      makeNextCookies({
        NEXT_LOCALE: '',
      }),
    );
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('falls back to localhost if BACKEND_URL is not defined', async () => {
    delete process.env.BACKEND_URL;

    const res = await bffFetch('/api/v1/ping');
    expect(res).toBeDefined();
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
  });

  test('forwards only allowlisted headers and preserves init.headers overrides', async () => {
    await bffFetch('/api/v1/ping', {
      method: 'POST',
      headers: {
        'x-request-id': 'override-rid',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ a: 1 }),
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect(url).toBe('https://backend.example/api/v1.0/ping');
    expect(init.cache).toBe('no-store');
    expect(init.method).toBe('POST');

    const sent = new Headers(init.headers as HeadersInit);

    expect(sent.get('authorization')).toBe('Bearer abc');
    expect(sent.get('cookie')).toBe('a=b');
    expect(sent.get('user-agent')).toBe('ua');
    expect(sent.get('x-guest-token')).toBe('gt');

    expect(sent.get('x-not-forwarded')).toBeNull();

    expect(sent.get('content-type')).toBe('application/json');
    expect(sent.get('x-request-id')).toBe('override-rid');
  });

  test('locale precedence: x-locale > NEXT_LOCALE cookie > accept-language header', async () => {
    (nextHeaders as jest.Mock).mockResolvedValueOnce(
      makeNextHeaders({
        'x-locale': 'lt',
        'accept-language': 'en-US,en;q=0.9',
      }),
    );
    (nextCookies as jest.Mock).mockResolvedValueOnce(
      makeNextCookies({ NEXT_LOCALE: 'fr' }),
    );

    await bffFetch('/api/v1/ping');

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const sent = new Headers(init.headers as HeadersInit);

    expect(sent.get('accept-language')).toBe('lt');
  });

  test('uses NEXT_LOCALE when x-locale is missing/blank', async () => {
    (nextHeaders as jest.Mock).mockResolvedValueOnce(
      makeNextHeaders({
        'x-locale': '   ',
        'accept-language': 'en-US,en;q=0.9',
      }),
    );
    (nextCookies as jest.Mock).mockResolvedValueOnce(
      makeNextCookies({ NEXT_LOCALE: 'fr' }),
    );

    await bffFetch('/api/v1/ping');

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const sent = new Headers(init.headers as HeadersInit);

    expect(sent.get('accept-language')).toBe('fr');
  });

  test('uses first language from accept-language when x-locale and cookie are missing', async () => {
    (nextHeaders as jest.Mock).mockResolvedValueOnce(
      makeNextHeaders({
        'accept-language': 'en-US,en;q=0.9,lt;q=0.8',
      }),
    );
    (nextCookies as jest.Mock).mockResolvedValueOnce(makeNextCookies({}));

    await bffFetch('/api/v1/ping');

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const sent = new Headers(init.headers as HeadersInit);

    expect(sent.get('accept-language')).toBe('en-US');
  });

  test('does not set accept-language when no locale sources exist', async () => {
    (nextHeaders as jest.Mock).mockResolvedValueOnce(makeNextHeaders({}));
    (nextCookies as jest.Mock).mockResolvedValueOnce(makeNextCookies({}));

    await bffFetch('/api/v1/ping');

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const sent = new Headers(init.headers as HeadersInit);

    expect(sent.get('accept-language')).toBeNull();
  });

  test('toUpstreamPath keeps /api/* as-is', async () => {
    await bffFetch('/api/v1/health');
    const [url] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://backend.example/api/v1.0/health');
  });

  test('toUpstreamPath keeps /api/v1.0/* as-is', async () => {
    await bffFetch('/api/v1.0/health');
    const [url] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://backend.example/api/v1.0/health');
  });

  test('toUpstreamPath prefixes /quizzes/metrics* with /api/v1.0/api/v1', async () => {
    await bffFetch('/quizzes/metrics/summary');
    const [url] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      'https://backend.example/api/v1.0/api/v1/quizzes/metrics/summary',
    );
  });

  test('toUpstreamPath prefixes /metrics* with /api/v1.0/api/v1', async () => {
    await bffFetch('/metrics/summary');
    const [url] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://backend.example/api/v1.0/api/v1/metrics/summary');
  });

  test('toUpstreamPath adds leading slash when missing', async () => {
    await bffFetch('api/v1/ping');
    const [url] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://backend.example/api/v1.0/ping');
  });

  test('init.headers can override computed accept-language', async () => {
    (nextHeaders as jest.Mock).mockResolvedValueOnce(
      makeNextHeaders({
        'x-locale': 'lt',
      }),
    );
    (nextCookies as jest.Mock).mockResolvedValueOnce(makeNextCookies({}));

    await bffFetch('/api/v1/ping', {
      headers: {
        'accept-language': 'de',
      },
    });

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const sent = new Headers(init.headers as HeadersInit);

    expect(sent.get('accept-language')).toBe('de');
  });
});
