const fetchMock = jest.fn();
(global as any).fetch = fetchMock;

class TestHttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

jest.mock(
    '@/shared/api/httpError',
    () => ({
        HttpError: TestHttpError,
    }),
    { virtual: true },
);

import { authFetch } from './authFetch';

describe('authFetch', () => {
    beforeEach(() => {
        fetchMock.mockReset();
    });

    test('returns response when status is not 401/403', async () => {
        const res = { status: 200 };
        fetchMock.mockResolvedValueOnce(res);

        const out = await authFetch('/api/data');

        expect(out).toBe(res);
    });

    test('refreshes token and retries original request', async () => {
        const first = { status: 401 };
        const refresh = { ok: true };
        const second = { status: 200 };

        fetchMock
            .mockResolvedValueOnce(first)
            .mockResolvedValueOnce(refresh)
            .mockResolvedValueOnce(second);

        const out = await authFetch('/api/data', { method: 'GET' });

        expect(out).toBe(second);

        expect(fetchMock.mock.calls).toEqual([
            ['/api/data', { method: 'GET', credentials: 'include' }],
            ['/api/auth/refresh', { method: 'POST', credentials: 'include' }],
            ['/api/data', { method: 'GET', credentials: 'include' }],
        ]);
    });

    test('throws HttpError when refresh fails', async () => {
        fetchMock
            .mockResolvedValueOnce({ status: 403 })
            .mockResolvedValueOnce({ ok: false });

        let error: unknown;

        try {
            await authFetch('/api/data');
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(TestHttpError);
        expect(error).toMatchObject({
            status: 403,
            message: 'Forbidden',
        });
    });

    test('throws HttpError when retry is still unauthorized', async () => {
        fetchMock
            .mockResolvedValueOnce({ status: 401 })
            .mockResolvedValueOnce({ ok: true })
            .mockResolvedValueOnce({ status: 403 });

        let error: unknown;

        try {
            await authFetch('/api/data');
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(TestHttpError);
        expect(error).toMatchObject({
            status: 403,
            message: 'Forbidden',
        });
    });
});
