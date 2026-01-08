import { useRegisterThenLogin } from './useRegisterThenLogin';

const invalidateQueriesMock = jest.fn();
const mutateAsyncMock = jest.fn();
const clearGuestMock = jest.fn();

jest.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        invalidateQueries: invalidateQueriesMock,
    }),
}));

let guestTokenValue: string | null = null;

jest.mock(
    '@/entities/guest/model/store',
    () => ({
        useGuestStore: (selector: any) =>
            selector({
                guestToken: guestTokenValue,
                clearGuestToken: clearGuestMock,
            }),
    }),
    { virtual: true },
);

jest.mock(
    '@/shared/api/generated/api',
    () => ({
        useRegister: () => ({
            mutateAsync: mutateAsyncMock,
            isPending: false,
        }),
    }),
    { virtual: true },
);

const safeParseMock = jest.fn();
jest.mock(
    '@/shared/validation/registerSchema',
    () => ({
        registerSchema: { safeParse: (...args: any[]) => safeParseMock(...args) },
    }),
    { virtual: true },
);

function mockFetchOnce(res: {
    ok: boolean;
    status: number;
    text: () => Promise<string>;
}) {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(res as any);
}

describe('useRegisterThenLogin', () => {
    beforeEach(() => {
        invalidateQueriesMock.mockReset();
        mutateAsyncMock.mockReset();
        clearGuestMock.mockReset();
        guestTokenValue = null;
        (globalThis.fetch as any) = jest.fn();
    });

    test('returns zodError when register schema invalid', async () => {
        safeParseMock.mockReturnValueOnce({ success: false, error: { issues: [] } });

        const h = useRegisterThenLogin();
        const res = await h.submit({
            email: 'x',
            password: 'y',
            confirmPassword: 'y',
        });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.phase).toBe('register');
            expect(res.zodError).toBeTruthy();
        }

        expect(mutateAsyncMock).not.toHaveBeenCalled();
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    test('successful register and login clears guest and invalidates queries', async () => {
        safeParseMock.mockReturnValueOnce({
            success: true,
            data: {
                email: ' TEST@MAIL.COM ',
                password: 'pass',
                displayName: ' John ',
            },
        });

        mutateAsyncMock.mockResolvedValueOnce({});

        mockFetchOnce({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ ok: true }),
        });

        const h = useRegisterThenLogin();
        const res = await h.submit({
            email: ' TEST@MAIL.COM ',
            password: 'pass',
            confirmPassword: 'pass',
            displayName: ' John ',
        });

        expect(res).toEqual({ ok: true });

        expect(mutateAsyncMock).toHaveBeenCalledWith({
            data: {
                email: 'test@mail.com',
                password: 'pass',
                displayName: 'John',
            },
        });

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(invalidateQueriesMock).toHaveBeenCalledWith({
            queryKey: ['/users/me'],
        });
        expect(clearGuestMock).toHaveBeenCalledTimes(1);
    });

    test('register failure returns phase=register with message', async () => {
        safeParseMock.mockReturnValueOnce({
            success: true,
            data: { email: 'a@b.com', password: 'pass' },
        });

        mutateAsyncMock.mockRejectedValueOnce(new Error('Register failed'));

        const h = useRegisterThenLogin();
        const res = await h.submit({
            email: 'a@b.com',
            password: 'pass',
            confirmPassword: 'pass',
        });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.phase).toBe('register');
            expect(res.message).toBe('Register failed');
        }

        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    test('login failure returns phase=login with message', async () => {
        guestTokenValue = 'gt';

        safeParseMock.mockReturnValueOnce({
            success: true,
            data: { email: 'a@b.com', password: 'pass' },
        });

        mutateAsyncMock.mockResolvedValueOnce({});

        mockFetchOnce({
            ok: false,
            status: 401,
            text: async () => JSON.stringify({ message: 'Bad credentials' }),
        });

        const h = useRegisterThenLogin();
        const res = await h.submit({
            email: 'a@b.com',
            password: 'pass',
            confirmPassword: 'pass',
        });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.phase).toBe('login');
            expect(res.message).toBe('Bad credentials');
        }

        expect(invalidateQueriesMock).not.toHaveBeenCalled();
        expect(clearGuestMock).not.toHaveBeenCalled();
    });

    test('login fallback message when response body empty', async () => {
        safeParseMock.mockReturnValueOnce({
            success: true,
            data: { email: 'a@b.com', password: 'pass' },
        });

        mutateAsyncMock.mockResolvedValueOnce({});

        mockFetchOnce({
            ok: false,
            status: 500,
            text: async () => '',
        });

        const h = useRegisterThenLogin();
        const res = await h.submit({
            email: 'a@b.com',
            password: 'pass',
            confirmPassword: 'pass',
        });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.phase).toBe('login');
            expect(res.message).toBe('Login failed (500)');
        }
    });
});
