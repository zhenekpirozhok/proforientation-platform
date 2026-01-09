import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from './RegisterForm';

type LinkProps = { href: string; children?: React.ReactNode };

jest.mock('next/link', () => {
  const Link = ({ href, children }: LinkProps) => <a href={href}>{children}</a>;
  Link.displayName = 'NextLinkMock';
  return { __esModule: true, default: Link };
});

const pushMock = jest.fn();

jest.mock(
  '@/shared/i18n/lib/navigation',
  () => ({
    useRouter: () => ({ push: pushMock }),
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
  '@/shared/validation/registerSchema',
  () => ({
    registerSchema: {
      safeParse: (...args: [unknown]) => safeParseMock(...args),
    },
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

const submitRegisterMock = jest.fn<Promise<SubmitResult>, [unknown]>();
let registerPending = false;

jest.mock(
  '@/features/auth/register/model/useRegisterThenLogin',
  () => ({
    useRegisterThenLogin: () => ({
      submit: submitRegisterMock,
      isPending: registerPending,
    }),
  }),
  { virtual: true },
);

const submitGoogleMock = jest.fn<Promise<SubmitResult>, [unknown]>();
let googlePending = false;

jest.mock(
  '@/features/auth/login/model/useGoogleOneTapLogin',
  () => ({
    useGoogleOneTapLogin: () => ({
      submit: submitGoogleMock,
      isPending: googlePending,
    }),
  }),
  { virtual: true },
);

type GoogleOneTapInitProps = {
  disabled?: boolean;
  onCredential: (t: string) => void;
};

jest.mock(
  '@/features/auth/login/ui/GoogleOneTapInit',
  () => {
    const GoogleOneTapInit = ({
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
    GoogleOneTapInit.displayName = 'GoogleOneTapInitMock';
    return { GoogleOneTapInit };
  },
  { virtual: true },
);

type AntdMessageApi = {
  error: jest.Mock<void, [string]>;
  success: jest.Mock<void, [string]>;
};

declare global {
  var __FORM__: Record<string, unknown> | undefined;
}

type AntdFormProps = {
  onFinish: (values: Record<string, unknown>) => void;
  children?: React.ReactNode;
};

type AntdFormItemProps = { children?: React.ReactNode };

type AntdInputProps = {
  name: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

type AntdButtonProps = {
  htmlType?: 'submit';
  children?: React.ReactNode;
  loading?: boolean;
};

type AntdTypographyProps = { children?: React.ReactNode };

type AntdModule = {
  Form: {
    (p: AntdFormProps): React.ReactElement;
    useForm: () => [unknown];
    Item: (p: AntdFormItemProps) => React.ReactElement;
  };
  Input: ((p: AntdInputProps) => React.ReactElement) & {
    Password: (p: AntdInputProps) => React.ReactElement;
  };
  Button: (p: AntdButtonProps) => React.ReactElement;
  Typography: {
    Title: (p: AntdTypographyProps) => React.ReactElement;
    Text: (p: AntdTypographyProps) => React.ReactElement;
  };
  message: AntdMessageApi;
  __message: AntdMessageApi;
};

jest.mock('antd', (): AntdModule => {
  const message: AntdMessageApi = {
    error: jest.fn(),
    success: jest.fn(),
  };

  const FormImpl = ({
    onFinish,
    children,
  }: AntdFormProps): React.ReactElement => (
    <form
      data-testid="form"
      onSubmit={(e) => {
        e.preventDefault();
        onFinish(globalThis.__FORM__ ?? {});
      }}
    >
      {children}
    </form>
  );
  FormImpl.displayName = 'AntdFormMock';

  const Form = FormImpl as unknown as AntdModule['Form'];
  Form.useForm = () => {
    const f: unknown = {};
    return [f];
  };

  const Item = ({ children }: AntdFormItemProps): React.ReactElement => (
    <>{children}</>
  );
  Item.displayName = 'AntdFormItemMock';
  Form.Item = Item;

  const InputImpl = ({
    name,
    onChange,
  }: AntdInputProps): React.ReactElement => {
    const raw = (globalThis.__FORM__ ?? {})[name];
    const value = typeof raw === 'string' || typeof raw === 'number' ? raw : '';
    return (
      <input
        data-testid={`input-${name}`}
        value={value}
        onChange={(e) => {
          globalThis.__FORM__ = {
            ...(globalThis.__FORM__ ?? {}),
            [name]: e.target.value,
          };
          onChange?.(e);
        }}
      />
    );
  };
  InputImpl.displayName = 'AntdInputMock';

  const Input = InputImpl as unknown as AntdModule['Input'];
  Input.Password = InputImpl;

  const Button = ({
    htmlType,
    children,
    loading,
  }: AntdButtonProps): React.ReactElement => (
    <button type={htmlType} disabled={Boolean(loading)}>
      {children}
    </button>
  );
  Button.displayName = 'AntdButtonMock';

  const Title = ({ children }: AntdTypographyProps): React.ReactElement => (
    <h2>{children}</h2>
  );
  Title.displayName = 'AntdTitleMock';

  const Text = ({ children }: AntdTypographyProps): React.ReactElement => (
    <span>{children}</span>
  );
  Text.displayName = 'AntdTextMock';

  return {
    Form,
    Input,
    Button,
    Typography: { Title, Text },
    message,
    __message: message,
  };
});

function getMessage(): AntdMessageApi {
  const antd = jest.requireMock('antd') as AntdModule;
  return antd.__message;
}

describe('RegisterForm', () => {
  let messageApi: AntdMessageApi;

  beforeEach(() => {
    pushMock.mockReset();
    applyZodErrorsToAntdFormMock.mockReset();
    safeParseMock.mockReset();
    submitRegisterMock.mockReset();
    submitGoogleMock.mockReset();
    registerPending = false;
    googlePending = false;
    globalThis.__FORM__ = {};
    messageApi = getMessage();
    messageApi.error.mockReset();
    messageApi.success.mockReset();
  });

  test('invalid schema applies zod errors', async () => {
    safeParseMock.mockReturnValueOnce({
      success: false,
      error: { issues: [] },
    });
    render(<RegisterForm />);
    fireEvent.submit(screen.getByTestId('form'));
    await waitFor(() =>
      expect(applyZodErrorsToAntdFormMock).toHaveBeenCalledTimes(1),
    );
    expect(submitRegisterMock).not.toHaveBeenCalled();
  });

  test('register error with zodError applies form errors', async () => {
    safeParseMock.mockReturnValueOnce({
      success: true,
      data: { email: 'a', password: 'b' },
    });
    submitRegisterMock.mockResolvedValueOnce({
      ok: false,
      zodError: { issues: [] },
    });
    render(<RegisterForm />);
    fireEvent.submit(screen.getByTestId('form'));
    await waitFor(() =>
      expect(applyZodErrorsToAntdFormMock).toHaveBeenCalledTimes(1),
    );
  });

  test('register error shows message', async () => {
    safeParseMock.mockReturnValueOnce({
      success: true,
      data: { email: 'a', password: 'b' },
    });
    submitRegisterMock.mockResolvedValueOnce({ ok: false, message: 'fail' });
    render(<RegisterForm />);
    fireEvent.submit(screen.getByTestId('form'));
    await waitFor(() => expect(messageApi.error).toHaveBeenCalledWith('fail'));
    expect(pushMock).not.toHaveBeenCalled();
  });

  test('register success redirects', async () => {
    safeParseMock.mockReturnValueOnce({
      success: true,
      data: { email: 'a', password: 'b' },
    });
    submitRegisterMock.mockResolvedValueOnce({ ok: true });
    render(<RegisterForm />);
    fireEvent.submit(screen.getByTestId('form'));
    await waitFor(() =>
      expect(messageApi.success).toHaveBeenCalledWith('Success'),
    );
    expect(pushMock).toHaveBeenCalledWith('/me/results');
  });

  test('google login error shows message', async () => {
    submitGoogleMock.mockResolvedValueOnce({
      ok: false,
      message: 'google bad',
    });
    render(<RegisterForm />);
    fireEvent.click(screen.getByTestId('google-credential'));
    await waitFor(() =>
      expect(messageApi.error).toHaveBeenCalledWith('google bad'),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  test('google login success redirects', async () => {
    submitGoogleMock.mockResolvedValueOnce({ ok: true });
    render(<RegisterForm />);
    fireEvent.click(screen.getByTestId('google-credential'));
    await waitFor(() =>
      expect(messageApi.success).toHaveBeenCalledWith('Success'),
    );
    expect(pushMock).toHaveBeenCalledWith('/me/results');
  });
});
