import { GET } from './route';

class TestHeaders {
    private m = new Map<string, string>();
    constructor(init?: Record<string, string>) {
        if (init) {
            Object.entries(init).forEach(([k, v]) =>
                this.m.set(k.toLowerCase(), v),
            );
        }
    }
    get(k: string) {
        return this.m.get(k.toLowerCase()) ?? null;
    }
    set(k: string, v: string) {
        this.m.set(k.toLowerCase(), v);
    }
}

class TestRequest {
    url: string;
    headers: TestHeaders;
    constructor(url: string, init?: { headers?: Record<string, string> }) {
        this.url = url;
        this.headers = new TestHeaders(init?.headers);
    }
}

class TestResponse {
    status: number;
    headers: TestHeaders;
    private body: string;

    constructor(body?: string, init?: { status?: number; headers?: Record<string, string> }) {
        this.body = body ?? '';
        this.status = init?.status ?? 200;
        this.headers = new TestHeaders(init?.headers);
    }

    async text() {
        return this.body;
    }

    async json() {
        return this.body ? JSON.parse(this.body) : null;
    }
}

(global as any).Response = TestResponse;

const bffAuthFetchMock = jest.fn();
const bffFetchMock = jest.fn();
const parseResponseMock = jest.fn();

jest.mock(
    '@/shared/api/bffAuthFetch',
    () => ({
        bffAuthFetch: (...args: any[]) => bffAuthFetchMock(...args),
    }),
    { virtual: true },
);

jest.mock(
    '@/shared/api/bff/proxy',
    () => ({
        bffFetch: (...args: any[]) => bffFetchMock(...args),
    }),
    { virtual: true },
);

jest.mock(
    '@/shared/api/parseResponse',
    () => ({
        parseResponse: (...args: any[]) => parseResponseMock(...args),
    }),
    { virtual: true },
);

function makeRes(ok: boolean, body: any, status = 200) {
    return {
        ok,
        status,
        headers: new TestHeaders({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(body),
    };
}

describe('GET /api/attempts/[attemptId]/view', () => {
    beforeEach(() => {
        bffAuthFetchMock.mockReset();
        bffFetchMock.mockReset();
        parseResponseMock.mockReset();
    });

    test('returns 400 for invalid attempt id', async () => {
        const req = new TestRequest('http://x/api/attempts/abc/view') as any;

        const res = await GET(req);

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ message: 'Invalid attempt id' });
    });

    test('propagates error from result fetch', async () => {
        bffAuthFetchMock.mockResolvedValueOnce(
            makeRes(false, { message: 'nope' }, 403),
        );

        const req = new TestRequest('http://x/api/attempts/10/view') as any;

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
        }) as any;

        const res = await GET(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(res.headers.get('x-locale')).toBe('ru');

        expect(json).toEqual({
            attemptId: 10,
            traits: [
                {
                    code: 'A',
                    name: 'Trait A',
                    description: 'desc',
                    score01: 0.7,
                },
            ],
            professions: [
                {
                    id: 5,
                    title: 'Dev',
                    description: 'code',
                    score01: 0.9,
                },
            ],
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

        const req = new TestRequest('http://x/api/attempts/3/view') as any;

        const res = await GET(req);
        const json = await res.json();

        expect(json).toEqual({
            attemptId: 3,
            traits: [
                {
                    code: 'X',
                    name: 'X',
                    description: undefined,
                    score01: 0,
                },
            ],
            professions: [
                {
                    id: 0,
                    title: '0',
                    description: undefined,
                    score01: 0,
                },
            ],
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

        const req = new TestRequest('http://x/api/attempts/1/view') as any;

        const res = await GET(req);

        expect(res.headers.get('x-locale')).toBe('en');
    });
});
