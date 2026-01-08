import { useRegisterUser } from './useRegisterUser';

const mutateAsyncMock = jest.fn();

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

describe('useRegisterUser', () => {
    beforeEach(() => {
        mutateAsyncMock.mockReset();
    });

    test('success normalizes payload and returns ok', async () => {
        mutateAsyncMock.mockResolvedValueOnce({});

        const h = useRegisterUser();
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
    });

    test('omits displayName when empty after trim', async () => {
        mutateAsyncMock.mockResolvedValueOnce({});

        const h = useRegisterUser();
        const res = await h.submit({
            email: 'a@b.com',
            password: 'pass',
            confirmPassword: 'pass',
            displayName: '   ',
        });

        expect(res).toEqual({ ok: true });

        expect(mutateAsyncMock).toHaveBeenCalledWith({
            data: {
                email: 'a@b.com',
                password: 'pass',
            },
        });
    });

    test('maps email already exists message to fieldErrors.email', async () => {
        mutateAsyncMock.mockRejectedValueOnce({
            message: 'Email already exists',
        });

        const h = useRegisterUser();
        const res = await h.submit({
            email: 'a@b.com',
            password: 'pass',
            confirmPassword: 'pass',
        });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.message).toBe('Email already exists');
            expect(res.fieldErrors).toEqual({
                email: 'This email is already registered',
            });
        }
    });

    test('maps weak password message to fieldErrors.password', async () => {
        mutateAsyncMock.mockRejectedValueOnce({
            message: 'Password is too weak',
        });

        const h = useRegisterUser();
        const res = await h.submit({
            email: 'a@b.com',
            password: 'pass',
            confirmPassword: 'pass',
        });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.message).toBe('Password is too weak');
            expect(res.fieldErrors).toEqual({
                password: 'Password is too weak',
            });
        }
    });

    test('returns message from Error instance', async () => {
        mutateAsyncMock.mockRejectedValueOnce(new Error('Boom'));

        const h = useRegisterUser();
        const res = await h.submit({
            email: 'a@b.com',
            password: 'pass',
            confirmPassword: 'pass',
        });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.message).toBe('Boom');
            expect(res.fieldErrors).toBeUndefined();
        }
    });

    test('returns string error as message', async () => {
        mutateAsyncMock.mockRejectedValueOnce('Bad request');

        const h = useRegisterUser();
        const res = await h.submit({
            email: 'a@b.com',
            password: 'pass',
            confirmPassword: 'pass',
        });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.message).toBe('Bad request');
            expect(res.fieldErrors).toBeUndefined();
        }
    });

    test('returns fallback message for unknown error shape', async () => {
        mutateAsyncMock.mockRejectedValueOnce({ foo: 'bar' });

        const h = useRegisterUser();
        const res = await h.submit({
            email: 'a@b.com',
            password: 'pass',
            confirmPassword: 'pass',
        });

        expect(res.ok).toBe(false);
        if (!res.ok) {
            expect(res.message).toBe('Registration failed');
            expect(res.fieldErrors).toBeUndefined();
        }
    });
});
