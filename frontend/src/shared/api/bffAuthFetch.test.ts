const bffFetchMock = jest.fn();
const fetchMock = jest.fn();

(global as any).fetch = fetchMock;

jest.mock(
    '@/shared/api/bff/proxy',
    () => ({
        bffFetch: (...args: any[]) => bffFetchMock(...args),
    }),
    { virtual: true },
);

let cookieValue: string | null = null;

jest.mock(
    'next/headers',
    () => ({
        cookies: async () => ({
            get: (name: string) =>
                name === 'cp_access' && cookieValue
                    ? { value: cookieValue }
                    : undefined,
        }),
    }),
    { virtual: true },
);

import { bffAuthFetch } from './bffAuthFetch';

describe('bffAuthFetch', () => {
    beforeEach(() => {
        bffFetchMock.mockReset();
        fetchMock.mockReset();
        cookieValue = null;
    });

    test('adds authorization header from cookie and returns response', async () => {
        cookieValue = 'token123';

        const res = { status: 200 };
        bffFetchMock.mockResolvedValueOnce(res);

        const out = await bffAuthFetch('/x');

        expect(out).toBe(res);
        expect(bffFetchMock).toHaveBeenCalledWith(
            '/x',
            expect.objectContaining({
                headers: expect.any(Headers),
            }),
        );

        const headers = bffFetchMock.mock.calls[0][1].headers as Headers;
        expect(headers.get('authorization')).toBe('Bearer token123');
    });

    test('returns first response when status is not 401/403', async () => {
        const res = { status: 200 };
        bffFetchMock.mockResolvedValueOnce(res);

        const out = await bffAuthFetch('/x');

        expect(out).toBe(res);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test('returns first response when refresh fails', async () => {
        cookieValue = 'token1';

        const first = { status: 401 };
        bffFetchMock.mockResolvedValueOnce(first);
        fetchMock.mockResolvedValueOnce({ ok: false });

        const out = await bffAuthFetch('/x');

        expect(out).toBe(first);
        expect(bffFetchMock).toHaveBeenCalledTimes(1);
    });

    test('returns first response when no new access token after refresh', async () => {
        cookieValue = 'token1';

        const first = { status: 403 };
        bffFetchMock.mockResolvedValueOnce(first);
        fetchMock.mockResolvedValueOnce({ ok: true });

        cookieValue = null;

        const out = await bffAuthFetch('/x');

        expect(out).toBe(first);
        expect(bffFetchMock).toHaveBeenCalledTimes(1);
    });

    test('retries with new authorization header after refresh', async () => {
        cookieValue = 'token1';

        const first = { status: 401 };
        const second = { status: 200 };

        bffFetchMock
            .mockResolvedValueOnce(first)
            .mockResolvedValueOnce(second);

        fetchMock.mockResolvedValueOnce({ ok: true });

        cookieValue = 'token2';

        const out = await bffAuthFetch('/x');

        expect(out).toBe(second);
        expect(bffFetchMock).toHaveBeenCalledTimes(2);

        const headers2 = bffFetchMock.mock.calls[1][1].headers as Headers;
        expect(headers2.get('authorization')).toBe('Bearer token2');
    });
});
