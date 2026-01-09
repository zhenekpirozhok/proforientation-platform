import { useLoginUser } from './useLoginUser';

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

type SafeParseSuccess<T> = {
  success: true;
  data: T;
};

type SafeParseFailure = {
  success: false;
  error: { issues: unknown[] };
};

type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

const safeParseMock = jest.fn<SafeParseResult<unknown>, [unknown]>();

jest.mock(
  '@/shared/validation/loginSchema',
  () => ({
    loginSchema: {
      safeParse: <T>(value: T): SafeParseResult<T> =>
        safeParseMock(value) as SafeParseResult<T>,
    },
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

describe('useLoginUser', () => {
  beforeEach(() => {
    invalidateQueriesMock.mockReset();
    guestTokenValue = null;

    const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn();
    globalThis.fetch = fetchMock;
  });

  test('returns zodError when schema invalid', async () => {
    safeParseMock.mockReturnValueOnce({
      success: false,
      error: { issues: [] },
    });

    const h = useLoginUser();
    const res = await h.submit({ email: 'a', password: 'b' });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.zodError).toBeTruthy();
    }

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

    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({
      email: 'a@b.com',
      password: 'x',
    });

    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['/users/me'],
    });
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
    const body = JSON.parse(String(init?.body));

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
    if (!res.ok) {
      expect(res.message).toBe('bad creds');
    }

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
    if (!res.ok) {
      expect(res.message).toBe('server down');
    }
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
    if (!res.ok) {
      expect(res.message).toBe('Login failed (403)');
    }
  });

  test('returns generic message when thrown value is not Error', async () => {
    safeParseMock.mockReturnValueOnce({
      success: true,
      data: { email: 'a@b.com', password: 'x' },
    });

    (
      globalThis.fetch as jest.MockedFunction<typeof fetch>
    ).mockImplementationOnce(() => {
      throw 'nope';
    });

    const h = useLoginUser();
    const res = await h.submit({ email: 'a@b.com', password: 'x' });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toBe('Login failed');
    }
  });
});
