import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

type LinkProps = { href: string; children?: React.ReactNode };

const MockLink = ({ href, children }: LinkProps) => (
  <a href={href}>{children}</a>
);
MockLink.displayName = 'NextLink';

jest.mock('next/link', () => ({
  __esModule: true,
  default: MockLink,
}));

const replaceMock = jest.fn();

jest.mock(
  '@/shared/i18n/lib/navigation',
  () => ({
    useRouter: () => ({ replace: replaceMock }),
  }),
  { virtual: true },
);

jest.mock('next-intl', () => ({
  useTranslations: () => (k: string) => k,
}));

const applyZodErrorsToAntdFormMock = jest.fn<void, [unknown, unknown]>();

jest.mock(
  '@/shared/validation/antdZod',
  () => ({
    applyZodErrorsToAntdForm: (...args: [unknown, unknown]) =>
      applyZodErrorsToAntdFormMock(...args),
  }),
  { virtual: true },
);

type SafeParseSuccess = {
  success: true;
  data: { email: string; password: string };
};
type SafeParseFail = { success: false; error: { issues: unknown[] } };
type SafeParseResult = SafeParseSuccess | SafeParseFail;

const safeParseMock = jest.fn<SafeParseResult, [unknown]>();

jest.mock(
  '@/shared/validation/loginSchema',
  () => ({
    loginSchema: { safeParse: (...args: [unknown]) => safeParseMock(...args) },
  }),
  { virtual: true },
);

type SubmitFail = {
  ok: false;
  message?: string;
  zodError?: { issues: unknown[] };
};
type SubmitOk = { ok: true };
type SubmitResult = SubmitFail | SubmitOk;

const passwordSubmitMock = jest.fn<Promise<SubmitResult>, [unknown]>();
const googleSubmitMock = jest.fn<Promise<SubmitResult>, [unknown]>();

let passwordPending = false;
let googlePending = false;

jest.mock(
  '@/features/auth/login/model/useLoginUser',
  () => ({
    useLoginUser: () => ({
      submit: passwordSubmitMock,
      isPending: passwordPending,
    }),
  }),
  { virtual: true },
);

jest.mock(
  '@/features/auth/login/model/useGoogleOneTapLogin',
  () => ({
    useGoogleOneTapLogin: () => ({
      submit: googleSubmitMock,
      isPending: googlePending,
    }),
  }),
  { virtual: true },
);

type GoogleOneTapInitProps = {
  disabled?: boolean;
  onCredential: (token: string) => void;
};

const MockGoogleOneTapInit = ({
  disabled,
  onCredential,
}: GoogleOneTapInitProps) => (
  <button
    type="button"
    data-testid="google-credential"
    disabled={disabled}
    onClick={() => onCredential('token')}
  >
    google
  </button>
);
MockGoogleOneTapInit.displayName = 'GoogleOneTapInit';

jest.mock(
  '@/features/auth/login/ui/GoogleOneTapInit',
  () => ({
    GoogleOneTapInit: MockGoogleOneTapInit,
  }),
  { virtual: true },
);

type AuthFetchResponse = { ok: boolean; json?: () => Promise<unknown> };
const authFetchMock = jest.fn<
  Promise<AuthFetchResponse>,
  [string, RequestInit?]
>();

jest.mock(
  '@/shared/api/authFetch',
  () => ({
    authFetch: (...args: [string, RequestInit?]) => authFetchMock(...args),
  }),
  { virtual: true },
);

const setUserMock = jest.fn<void, [unknown]>();
const storeUser: unknown = null;

type SessionSlice = { user: unknown };
type SessionSelector<T> = (s: SessionSlice) => T;

type SessionStoreHook = (<T>(selector: SessionSelector<T>) => T) & {
  getState: () => { setUser: (u: unknown) => void };
};

const useSessionStoreExport = (<T,>(selector: SessionSelector<T>) =>
  selector({ user: storeUser })) as unknown as SessionStoreHook;

useSessionStoreExport.getState = () => ({ setUser: setUserMock });

jest.mock(
  '@/entities/session/model/store',
  () => ({
    useSessionStore: useSessionStoreExport,
  }),
  { virtual: true },
);

type MessageApiMock = {
  error: jest.Mock<void, [string]>;
  success: jest.Mock<void, [string]>;
  info: jest.Mock<void, [string]>;
  warning: jest.Mock<void, [string]>;
  loading: jest.Mock<void, [string]>;
};

let messageMock: MessageApiMock;

type AntdFormProps = {
  onFinish?: (values: Record<string, unknown>) => void;
  children?: React.ReactNode;
};
type AntdInputProps = Record<string, unknown>;
type AntdButtonProps = Record<string, unknown>;

jest.mock('antd', () => {
  const Form = ({ onFinish, children }: AntdFormProps): React.ReactElement => (
    <form
      data-testid="antd-form"
      onSubmit={(e) => {
        e.preventDefault();
        onFinish?.({});
      }}
    >
      {children}
    </form>
  );
  Form.displayName = 'AntdForm';

  const Input = (props: AntdInputProps): React.ReactElement => (
    <input {...props} />
  );
  (Input as { displayName?: string }).displayName = 'AntdInput';

  const Button = (props: AntdButtonProps): React.ReactElement => (
    <button {...props} />
  );
  (Button as { displayName?: string }).displayName = 'AntdButton';

  const api: MessageApiMock = {
    error: jest.fn<void, [string]>(),
    success: jest.fn<void, [string]>(),
    info: jest.fn<void, [string]>(),
    warning: jest.fn<void, [string]>(),
    loading: jest.fn<void, [string]>(),
  };

  messageMock = api;

  return {
    Form,
    Input,
    Button,
    __message: api,
  };
});

describe('LoginForm', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    applyZodErrorsToAntdFormMock.mockReset();
    safeParseMock.mockReset();
    passwordSubmitMock.mockReset();
    googleSubmitMock.mockReset();
    authFetchMock.mockReset();
    setUserMock.mockReset();
    passwordPending = false;
    googlePending = false;
    messageMock.error.mockReset();
    messageMock.success.mockReset();
    messageMock.info.mockReset();
    messageMock.warning.mockReset();
    messageMock.loading.mockReset();
  });

  test('invalid schema applies zod errors', async () => {
    safeParseMock.mockReturnValueOnce({
      success: false,
      error: { issues: [] },
    });

    render(<LoginForm />);
    fireEvent.submit(screen.getByTestId('antd-form'));

    await waitFor(() =>
      expect(applyZodErrorsToAntdFormMock).toHaveBeenCalledTimes(1),
    );
    expect(passwordSubmitMock).not.toHaveBeenCalled();
  });

  test('google credential triggers submit', async () => {
    googleSubmitMock.mockResolvedValueOnce({ ok: true });

    render(<LoginForm />);
    fireEvent.click(screen.getByTestId('google-credential'));

    await waitFor(() => expect(googleSubmitMock).toHaveBeenCalledTimes(1));
  });
});
