import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from './RegisterForm';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

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

const applyZodErrorsToAntdFormMock = jest.fn();
jest.mock(
  '@/shared/validation/antdZod',
  () => ({
    applyZodErrorsToAntdForm: (...args: unknown[]) =>
      applyZodErrorsToAntdFormMock(...args),
  }),
  { virtual: true },
);

const safeParseMock = jest.fn();
jest.mock(
  '@/shared/validation/registerSchema',
  () => ({
    registerSchema: { safeParse: (...args: unknown[]) => safeParseMock(...args) },
  }),
  { virtual: true },
);

const submitRegisterMock = jest.fn();
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

const submitGoogleMock = jest.fn();
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

jest.mock(
  '@/features/auth/login/ui/GoogleOneTapInit',
  () => ({
    GoogleOneTapInit: ({
      disabled,
      onCredential,
    }: {
      disabled?: boolean;
      onCredential: (t: string) => void;
    }) => (
      <button
        type="button"
        data-testid="google-credential"
        disabled={disabled}
        onClick={() => onCredential('token')}
      >
        google
      </button>
    ),
  }),
  { virtual: true },
);

let messageApi: { error: jest.Mock; success: jest.Mock };

jest.mock('antd', () => {
  const React = require('react');

  const message = {
    error: jest.fn(),
    success: jest.fn(),
  };

  const Form = ({ onFinish, children }: any) => (
    <form
      data-testid="form"
      onSubmit={(e) => {
        e.preventDefault();
        onFinish((globalThis as any).__FORM__ ?? {});
      }}
    >
      {children}
    </form>
  );

  Form.useForm = () => [{}];
  Form.Item = ({ name, children }: any) =>
    name ? React.cloneElement(children, { name }) : children;

  const Input = ({ name, onChange }: any) => (
    <input
      data-testid={`input-${name}`}
      onChange={(e) => {
        (globalThis as any).__FORM__ = {
          ...(globalThis as any).__FORM__,
          [name]: e.target.value,
        };
        onChange?.(e);
      }}
    />
  );

  Input.Password = Input;

  const Button = ({ htmlType, children, loading }: any) => (
    <button type={htmlType} disabled={loading}>
      {children}
    </button>
  );

  const Typography = {
    Title: ({ children }: any) => <h2>{children}</h2>,
    Text: ({ children }: any) => <span>{children}</span>,
  };

  return {
    Form,
    Input,
    Button,
    Typography,
    message,
    __message: message,
  };
});

function getMessage() {
  const antd = require('antd');
  return antd.__message;
}

describe('RegisterForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    applyZodErrorsToAntdFormMock.mockReset();
    safeParseMock.mockReset();
    submitRegisterMock.mockReset();
    submitGoogleMock.mockReset();
    registerPending = false;
    googlePending = false;
    (globalThis as any).__FORM__ = {};
    messageApi = getMessage();
    messageApi.error.mockReset();
    messageApi.success.mockReset();
  });

  test('invalid schema applies zod errors', async () => {
    safeParseMock.mockReturnValueOnce({ success: false, error: { issues: [] } });

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

    submitRegisterMock.mockResolvedValueOnce({
      ok: false,
      message: 'fail',
    });

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

    await waitFor(() => expect(messageApi.success).toHaveBeenCalledWith('Success'));
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
