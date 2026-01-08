import { useLoginUser } from './useLoginUser';

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

jest.mock(
    '@/entities/guest/model/store',
    () => ({
        useGuestStore: (selector: any) => selector({ guestToken: guestTokenValue }),
    }),
    { virtual: true },
);

const safeParseMock = jest.fn();
jest.mock(
    '@/shared/validation/loginSchema',
    () => ({
        loginSchema: { safeParse: (...args: any[]) => safeParseMock(...args) },
    }),
    { virtual: true },
);

function mockFetchOnce(res: { ok: boolean; status: number; text: () => Promise<string> }) {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(res as any);
}

describe('useLoginUser', () => {
    beforeEach(() => {
        invalidateQueriesMock.mockReset();
        guestTokenValue = null;
        (globalThis as any).fetch = jest.fn();
    });

    test('returns zodError when schema invalid', async () => {
        safeParseMock.mockReturnValueOnce({ success: false, error: { issues: [] } });

        const h = useLoginUser();
        const res = await h.submit({ email: 'a', password: 'b' });

        expect(res.ok).toBe(false);
        expect('zodError' in res && res.zodError).toBeTruthy();
        expect((globalThis.fetch as jest.Mock).mock.calls.length).toBe(0);
        expect(invalidateQueriesMock).not.toHaveBeenCalled();
    });

    test('success trims and lowercases email and invalidates /users/me', async () => {
        safeParseMock.mockReturnValueOnce({
            success: true,
            data: { email: ' A@B.COM ', password: 'x' },
        });

        mockFetchOnce({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ ok: true }),
        });

        const h = useLoginUser();
        const res = await h.submit({ email: ' A@B.COM ', password: 'x' });

        expect(res).toEqual({ ok: true });

        const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
        expect(url).toBe('/api/auth/login');

        const body = JSON.parse(init.body);
        expect(body).toEqual({
            email: 'a@b.com',
            password: 'x',
        });

        expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['/users/me'] });
    });

    test('includes guestToken when present', async () => {
        guestTokenValue = 'gt';

        safeParseMock.mockReturnValueOnce({
            success: true,
            data: { email: 'a@b.com', password: 'x' },
        });

        mockFetchOnce({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ ok: true }),
        });

        const h = useLoginUser();
        const res = await h.submit({ email: 'a@b.com', password: 'x' });

        expect(res).toEqual({ ok: true });

        const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(init.body);
        expect(body).toEqual({
            email: 'a@b.com',
            password: 'x',
            guestToken: 'gt',
        });
    });

    test('returns message from {message} json on non-ok response', async () => {
        safeParseMock.mockReturnValueOnce({
            success: true,
            data: { email: 'a@b.com', password: 'x' },
        });

        mockFetchOnce({
            ok: false,
            status: 401,
            text: async () => JSON.stringify({ message: 'bad creds' }),
        });

        const h = useLoginUser();
        const res = await h.submit({ email: 'a@b.com', password: 'x' });

        expect(res.ok).toBe(false);
        expect('message' in res ? res.message : undefined).toBe('bad creds');
        expect(invalidateQueriesMock).not.toHaveBeenCalled();
    });

    test('returns message from plain text on non-ok response', async () => {
        safeParseMock.mockReturnValueOnce({
            success: true,
            data: { email: 'a@b.com', password: 'x' },
        });

        mockFetchOnce({
            ok: false,
            status: 500,
            text: async () => 'server down',
        });

        const h = useLoginUser();
        const res = await h.submit({ email: 'a@b.com', password: 'x' });

        expect(res.ok).toBe(false);
        expect('message' in res ? res.message : undefined).toBe('server down');
    });

    test('returns fallback message when body empty', async () => {
        safeParseMock.mockReturnValueOnce({
            success: true,
            data: { email: 'a@b.com', password: 'x' },
        });

        mockFetchOnce({
            ok: false,
            status: 403,
            text: async () => '',
        });

        const h = useLoginUser();
        const res = await h.submit({ email: 'a@b.com', password: 'x' });

        expect(res.ok).toBe(false);
        expect('message' in res ? res.message : undefined).toBe('Login failed (403)');
    });

    test('returns generic message when thrown value is not Error', async () => {
        safeParseMock.mockReturnValueOnce({
            success: true,
            data: { email: 'a@b.com', password: 'x' },
        });

        (globalThis.fetch as jest.Mock).mockImplementationOnce(() => {
            throw 'nope';
        });

        const h = useLoginUser();
        const res = await h.submit({ email: 'a@b.com', password: 'x' });

        expect(res.ok).toBe(false);
        expect('message' in res ? res.message : undefined).toBe('Login failed');
    });
});
