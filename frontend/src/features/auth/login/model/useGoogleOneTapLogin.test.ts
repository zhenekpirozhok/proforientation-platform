import { useGoogleOneTapLogin } from './useGoogleOneTapLogin';

const invalidateQueriesMock = jest.fn();

jest.mock('@tanstack/react-query', () => {
    const useQueryClient = () => ({
        invalidateQueries: invalidateQueriesMock,
    });

    const useMutation = (cfg: any) => {
        return {
            isPending: false,
            mutateAsync: async (values: any) => {
                const out = await cfg.mutationFn(values);
                if (cfg.onSuccess) await cfg.onSuccess(out);
                return out;
            },
        };
    };

    return { useQueryClient, useMutation };
});

let guestTokenValue: string | null = null;

jest.mock('@/entities/guest/model/store', () => ({
    useGuestStore: (selector: any) => selector({ guestToken: guestTokenValue }),
}), { virtual: true });

function mockFetchOnce(res: { ok: boolean; status: number; text: () => Promise<string> }) {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(res as any);
}

describe('useGoogleOneTapLogin', () => {
    beforeEach(() => {
        invalidateQueriesMock.mockReset();
        guestTokenValue = null;
        (globalThis as any).fetch = jest.fn();
        Object.defineProperty(document, 'cookie', {
            value: '',
            writable: true,
            configurable: true,
        });
    });

    test('returns zodError when token invalid', async () => {
        const h = useGoogleOneTapLogin();
        const res = await h.submit({ token: 'short' });

        expect(res.ok).toBe(false);
        expect('zodError' in res && res.zodError).toBeTruthy();
        expect((globalThis.fetch as jest.Mock).mock.calls.length).toBe(0);
        expect(invalidateQueriesMock).not.toHaveBeenCalled();
    });

    test('success posts token only when no guest token and invalidates /users/me', async () => {
        mockFetchOnce({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ ok: true }),
        });

        const h = useGoogleOneTapLogin();
        const res = await h.submit({ token: '1234567890a' });

        expect(res).toEqual({ ok: true });
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);

        const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe('/api/auth/google-onetap');
        expect(init.method).toBe('POST');
        expect(init.credentials).toBe('include');
        expect(init.headers).toEqual({ 'content-type': 'application/json' });

        const body = JSON.parse(init.body);
        expect(body).toEqual({ token: '1234567890a' });

        expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['/users/me'] });
    });

    test('uses guestToken from store when present', async () => {
        guestTokenValue = 'gt-store';

        mockFetchOnce({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ ok: true }),
        });

        const h = useGoogleOneTapLogin();
        const res = await h.submit({ token: '1234567890a' });

        expect(res).toEqual({ ok: true });

        const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(init.body);
        expect(body).toEqual({ token: '1234567890a', guestToken: 'gt-store' });
    });

    test('falls back to cp_access cookie when store guestToken is null', async () => {
        guestTokenValue = null;
        (document as any).cookie = 'cp_access=gt%2Bcookie; other=x';

        mockFetchOnce({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ ok: true }),
        });

        const h = useGoogleOneTapLogin();
        const res = await h.submit({ token: '1234567890a' });

        expect(res).toEqual({ ok: true });

        const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(init.body);
        expect(body).toEqual({ token: '1234567890a', guestToken: 'gt+cookie' });
    });

    test('returns message from {message} json on non-ok response', async () => {
        mockFetchOnce({
            ok: false,
            status: 401,
            text: async () => JSON.stringify({ message: 'bad token' }),
        });

        const h = useGoogleOneTapLogin();
        const res = await h.submit({ token: '1234567890a' });

        expect(res.ok).toBe(false);
        expect('message' in res ? res.message : undefined).toBe('bad token');
        expect(invalidateQueriesMock).not.toHaveBeenCalled();
    });

    test('returns message from plain text on non-ok response', async () => {
        mockFetchOnce({
            ok: false,
            status: 500,
            text: async () => 'server down',
        });

        const h = useGoogleOneTapLogin();
        const res = await h.submit({ token: '1234567890a' });

        expect(res.ok).toBe(false);
        expect('message' in res ? res.message : undefined).toBe('server down');
        expect(invalidateQueriesMock).not.toHaveBeenCalled();
    });

    test('returns fallback message when response body is empty', async () => {
        mockFetchOnce({
            ok: false,
            status: 403,
            text: async () => '',
        });

        const h = useGoogleOneTapLogin();
        const res = await h.submit({ token: '1234567890a' });

        expect(res.ok).toBe(false);
        expect('message' in res ? res.message : undefined).toBe('Login failed (403)');
        expect(invalidateQueriesMock).not.toHaveBeenCalled();
    });

    test('returns generic message when thrown value is not Error', async () => {
        (globalThis.fetch as jest.Mock).mockImplementationOnce(() => {
            throw 'nope';
        });

        const h = useGoogleOneTapLogin();
        const res = await h.submit({ token: '1234567890a' });

        expect(res.ok).toBe(false);
        expect('message' in res ? res.message : undefined).toBe('Login failed');
        expect(invalidateQueriesMock).not.toHaveBeenCalled();
    });
});
