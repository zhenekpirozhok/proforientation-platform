import { GET } from './route';

class TestHeaders extends Headers {
  constructor(init?: Record<string, string>) {
    super();
    if (init) {
      Object.entries(init).forEach(([k, v]) => this.set(k, v));
    }
  }
}

class TestRequest extends Request {
  constructor(
    input: string,
    init?: RequestInit & { headers?: Record<string, string> },
  ) {
    super(input, { ...init, headers: new TestHeaders(init?.headers) });
  }
}

class TestResponse extends Response {
  constructor(
    body?: string,
    init?: ResponseInit & { headers?: Record<string, string> },
  ) {
    super(body, { ...init, headers: new TestHeaders(init?.headers) });
  }
}

(global as unknown as { Response: typeof TestResponse }).Response =
  TestResponse;

const bffAuthFetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();
const bffFetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();
const parseResponseMock = jest.fn<Promise<unknown>, [unknown]>();

jest.mock(
  '@/shared/api/bffAuthFetch',
  () => ({
    bffAuthFetch: (...args: Parameters<typeof bffAuthFetchMock>) =>
      bffAuthFetchMock(...args),
  }),
  { virtual: true },
);

jest.mock(
  '@/shared/api/bff/proxy',
  () => ({
    bffFetch: (...args: Parameters<typeof bffFetchMock>) =>
      bffFetchMock(...args),
  }),
  { virtual: true },
);

jest.mock(
  '@/shared/api/parseResponse',
  () => ({
    parseResponse: (...args: Parameters<typeof parseResponseMock>) =>
      parseResponseMock(...args),
  }),
  { virtual: true },
);

function makeRes(ok: boolean, body: unknown, status = 200): Response {
  return new TestResponse(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('GET /api/attempts/[attemptId]/view', () => {
  beforeEach(() => {
    bffAuthFetchMock.mockReset();
    bffFetchMock.mockReset();
    parseResponseMock.mockReset();
  });

  test('returns 400 for invalid attempt id', async () => {
    const req = new TestRequest('http://x/api/attempts/abc/view');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: 'Invalid attempt id' });
  });

  test('propagates error from result fetch', async () => {
    bffAuthFetchMock.mockResolvedValueOnce(
      makeRes(false, { message: 'nope' }, 403),
    );
    const req = new TestRequest('http://x/api/attempts/10/view');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  test('happy path merges traits and professions', async () => {
    bffAuthFetchMock.mockResolvedValueOnce(makeRes(true, {}));
    bffFetchMock
      .mockResolvedValueOnce(makeRes(true, {}))
      .mockResolvedValueOnce(makeRes(true, {}));

    parseResponseMock
      .mockResolvedValueOnce({
        traitScores: [{ traitCode: 'A', score: 0.7 }],
        recommendations: [{ professionId: 5, score: 0.9 }],
      })
      .mockResolvedValueOnce([
        { code: 'A', name: 'Trait A', description: 'desc' },
      ])
      .mockResolvedValueOnce({
        content: [{ id: 5, title: 'Dev', description: 'code' }],
      });

    const req = new TestRequest('http://x/api/attempts/10/view', {
      headers: { 'x-locale': 'ru' },
    });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('x-locale')).toBe('ru');
    expect(json).toEqual({
      attemptId: 10,
      traits: [
        { code: 'A', name: 'Trait A', description: 'desc', score01: 0.7 },
      ],
      professions: [{ id: 5, title: 'Dev', description: 'code', score01: 0.9 }],
    });
  });

  test('falls back when meta is missing or values invalid', async () => {
    bffAuthFetchMock.mockResolvedValueOnce(makeRes(true, {}));
    bffFetchMock
      .mockResolvedValueOnce(makeRes(true, {}))
      .mockResolvedValueOnce(makeRes(true, {}));

    parseResponseMock
      .mockResolvedValueOnce({
        traitScores: [{ traitCode: 'X', score: 'bad' }],
        recommendations: [{ professionId: 'nope', score: null }],
      })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const req = new TestRequest('http://x/api/attempts/3/view');
    const res = await GET(req);
    const json = await res.json();

    expect(json).toEqual({
      attemptId: 3,
      traits: [{ code: 'X', name: 'X', description: undefined, score01: 0 }],
      professions: [{ id: 0, title: '0', description: undefined, score01: 0 }],
    });
  });

  test('locale defaults to en', async () => {
    bffAuthFetchMock.mockResolvedValueOnce(makeRes(true, {}));
    bffFetchMock
      .mockResolvedValueOnce(makeRes(true, {}))
      .mockResolvedValueOnce(makeRes(true, {}));
    parseResponseMock
      .mockResolvedValueOnce({ traitScores: [], recommendations: [] })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const req = new TestRequest('http://x/api/attempts/1/view');
    const res = await GET(req);
    expect(res.headers.get('x-locale')).toBe('en');
  });
});
