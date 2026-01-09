import { useGoogleOneTapLogin } from './useGoogleOneTapLogin';

const invalidateQueriesMock = jest.fn();

type MutationConfig<TValues, TResult> = {
  mutationFn: (values: TValues) => Promise<TResult>;
  onSuccess?: (data: TResult) => Promise<void> | void;
};

jest.mock('@tanstack/react-query', () => {
  const useQueryClient = () => ({
    invalidateQueries: invalidateQueriesMock,
  });

  const useMutation = <TValues, TResult>(
    cfg: MutationConfig<TValues, TResult>,
  ) => ({
    isPending: false,
    mutateAsync: async (values: TValues): Promise<TResult> => {
      const result = await cfg.mutationFn(values);
      if (cfg.onSuccess) {
        await cfg.onSuccess(result);
      }
      return result;
    },
  });

  return { useQueryClient, useMutation };
});

let guestTokenValue: string | null = null;

jest.mock(
  '@/entities/guest/model/store',
  () => ({
    useGuestStore: <T>(
      selector: (state: { guestToken: string | null }) => T,
    ): T =>
      selector({
        guestToken: guestTokenValue,
      }),
  }),
  { virtual: true },
);

type MockFetchResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function mockFetchOnce(response: MockFetchResponse): void {
  const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;

  fetchMock.mockResolvedValueOnce({
    ok: response.ok,
    status: response.status,
    text: response.text,
  } as Response);
}

describe('useGoogleOneTapLogin', () => {
  beforeEach(() => {
    invalidateQueriesMock.mockReset();
    guestTokenValue = null;

    const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn();
    globalThis.fetch = fetchMock;

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
    if (!res.ok) {
      expect(res.zodError).toBeTruthy();
    }

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
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('include');
    expect(init?.headers).toEqual({ 'content-type': 'application/json' });

    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({ token: '1234567890a' });

    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['/users/me'],
    });
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
    const body = JSON.parse(String(init?.body));

    expect(body).toEqual({
      token: '1234567890a',
      guestToken: 'gt-store',
    });
  });

  test('falls back to cp_access cookie when store guestToken is null', async () => {
    guestTokenValue = null;

    Object.defineProperty(document, 'cookie', {
      value: 'cp_access=gt%2Bcookie; other=x',
      writable: true,
      configurable: true,
    });

    mockFetchOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });

    const h = useGoogleOneTapLogin();
    const res = await h.submit({ token: '1234567890a' });

    expect(res).toEqual({ ok: true });

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(String(init?.body));

    expect(body).toEqual({
      token: '1234567890a',
      guestToken: 'gt+cookie',
    });
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
    if (!res.ok) {
      expect(res.message).toBe('bad token');
    }

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
    if (!res.ok) {
      expect(res.message).toBe('server down');
    }

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
    if (!res.ok) {
      expect(res.message).toBe('Login failed (403)');
    }

    expect(invalidateQueriesMock).not.toHaveBeenCalled();
  });

  test('returns generic message when thrown value is not Error', async () => {
    (
      globalThis.fetch as jest.MockedFunction<typeof fetch>
    ).mockImplementationOnce(() => {
      throw 'nope';
    });

    const h = useGoogleOneTapLogin();
    const res = await h.submit({ token: '1234567890a' });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toBe('Login failed');
    }

    expect(invalidateQueriesMock).not.toHaveBeenCalled();
  });
});
