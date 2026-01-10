/**
 * @jest-environment node
 */

import { GET } from './route';

type BffFetch = (path: string, init?: RequestInit) => Promise<UpstreamResponse>;

type UpstreamResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  __data: unknown;
};

const bffFetchMock = jest.fn<ReturnType<BffFetch>, Parameters<BffFetch>>();
const parseResponseMock = jest.fn<unknown, [UpstreamResponse]>();

jest.mock(
  '@/shared/api/bff/proxy',
  () => ({
    bffFetch: (...args: Parameters<BffFetch>) => bffFetchMock(...args),
  }),
  { virtual: true },
);

jest.mock(
  '@/shared/api/parseResponse',
  () => ({
    parseResponse: (...args: [UpstreamResponse]) => parseResponseMock(...args),
  }),
  { virtual: true },
);

class TestResponse {
  private _body: string;
  status: number;
  ok: boolean;
  headers: Map<string, string>;

  constructor(
    body: string,
    init?: { status?: number; headers?: Record<string, string> },
  ) {
    this._body = body ?? '';
    this.status = init?.status ?? 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Map(Object.entries(init?.headers ?? {}));
  }

  async text() {
    return this._body;
  }
}

globalThis.Response = TestResponse as unknown as typeof Response;

function makeReq(url: string, headers?: Record<string, string>): Request {
  return new Request(url, { headers });
}

function upstreamOk(data: unknown): UpstreamResponse {
  return {
    ok: true,
    status: 200,
    async text() {
      return JSON.stringify(data);
    },
    __data: data,
  };
}

function upstreamErr(status: number, body: string): UpstreamResponse {
  return {
    ok: false,
    status,
    async text() {
      return body;
    },
    __data: null,
  };
}

describe('api/results/catalog GET', () => {
  beforeEach(() => {
    bffFetchMock.mockReset();
    parseResponseMock.mockReset();
    parseResponseMock.mockImplementation((res: UpstreamResponse) => res.__data);
  });

  test('returns 400 when quizId is missing/invalid', async () => {
    const r1 = await GET(makeReq('http://localhost/api/results/catalog'));
    expect(r1.status).toBe(400);
    expect(await r1.text()).toBe(
      JSON.stringify({ message: 'quizId is required' }),
    );

    const r2 = await GET(
      makeReq('http://localhost/api/results/catalog?quizId=abc'),
    );
    expect(r2.status).toBe(400);

    const r3 = await GET(
      makeReq('http://localhost/api/results/catalog?quizId=-1'),
    );
    expect(r3.status).toBe(400);
  });

  test('returns 502 when quiz categoryId is missing', async () => {
    bffFetchMock.mockImplementation(async (path: string) => {
      if (path === '/quizzes/12') return upstreamOk({ id: 12, title: 'T' });
      throw new Error(`unexpected ${path}`);
    });

    const res = await GET(
      makeReq('http://localhost/api/results/catalog?quizId=12'),
    );
    expect(res.status).toBe(502);

    const body = await res.text();
    const parsed = JSON.parse(body) as { message: string; quiz: unknown };
    expect(parsed.message).toBe('Quiz categoryId is missing');
    expect(parsed.quiz).toEqual({ id: 12, title: 'T' });
  });

  test('happy path joins quiz/traits/professions and filters by categoryId; forwards x-locale', async () => {
    const quizId = 7;
    const categoryId = 10;

    bffFetchMock.mockImplementation(
      async (path: string, init?: RequestInit) => {
        if (path === `/quizzes/${quizId}`) {
          expect(init?.headers).toEqual({ 'x-locale': 'lt' });
          return upstreamOk({ id: quizId, categoryId, title: 'Quiz' });
        }

        if (path === '/traits') {
          expect(init?.headers).toEqual({ 'x-locale': 'lt' });
          return upstreamOk([{ id: 1, title: 'Trait1' }]);
        }

        if (path.startsWith('/professions?')) {
          expect(init?.headers).toEqual({ 'x-locale': 'lt' });

          const u = new URL(`http://x${path}`);
          const page = u.searchParams.get('page');

          if (page === '1') {
            return upstreamOk({
              content: [
                { id: 1, title: 'P1', categoryId: 10 },
                { id: 2, title: 'P2', categoryId: 11 },
              ],
              last: false,
              number: 0,
              totalElements: 3,
            });
          }

          if (page === '2') {
            return upstreamOk({
              content: [{ id: 3, title: 'P3', categoryId: 10 }],
              last: true,
              number: 1,
              totalElements: 3,
            });
          }

          throw new Error(`unexpected professions page=${page}`);
        }

        throw new Error(`unexpected ${path}`);
      },
    );

    const res = await GET(
      makeReq(`http://localhost/api/results/catalog?quizId=${quizId}`, {
        'x-locale': 'lt',
      }),
    );

    expect(res.status).toBe(200);

    const body = JSON.parse(await res.text()) as {
      quizId: number;
      categoryId: number;
      traits: Array<{ id: number; title: string }>;
      professions: Array<{ id: number; categoryId: number }>;
      debug: {
        traitsCount: number;
        professionsTotal: number;
        professionsInCategory: number;
      };
    };

    expect(body.quizId).toBe(quizId);
    expect(body.categoryId).toBe(categoryId);

    expect(body.traits).toEqual([{ id: 1, title: 'Trait1' }]);

    expect(Array.isArray(body.professions)).toBe(true);
    expect(body.professions.map((p) => p.id).sort()).toEqual([1, 3]);
    expect(body.professions.every((p) => p.categoryId === 10)).toBe(true);

    expect(body.debug).toEqual({
      traitsCount: 1,
      professionsTotal: 3,
      professionsInCategory: 2,
    });
  });

  test('returns 500 when upstream returns non-ok (traits)', async () => {
    const quizId = 5;

    bffFetchMock.mockImplementation(async (path: string) => {
      if (path === `/quizzes/${quizId}`)
        return upstreamOk({ id: quizId, categoryId: 1 });
      if (path === '/traits') return upstreamErr(503, 'bad');
      throw new Error(`unexpected ${path}`);
    });

    const res = await GET(
      makeReq(`http://localhost/api/results/catalog?quizId=${quizId}`),
    );
    expect(res.status).toBe(500);

    const body = JSON.parse(await res.text()) as { message: string };
    expect(typeof body.message).toBe('string');
    expect(body.message).toContain('/traits failed: 503');
  });

  test('returns 500 when upstream returns non-ok (professions)', async () => {
    const quizId = 6;

    bffFetchMock.mockImplementation(async (path: string) => {
      if (path === `/quizzes/${quizId}`)
        return upstreamOk({ id: quizId, categoryId: 1 });
      if (path === '/traits') return upstreamOk([]);
      if (path.startsWith('/professions?')) return upstreamErr(500, 'oops');
      throw new Error(`unexpected ${path}`);
    });

    const res = await GET(
      makeReq(`http://localhost/api/results/catalog?quizId=${quizId}`),
    );
    expect(res.status).toBe(500);

    const body = JSON.parse(await res.text()) as { message: string };
    expect(body.message).toContain('/professions failed: 500');
  });
});
