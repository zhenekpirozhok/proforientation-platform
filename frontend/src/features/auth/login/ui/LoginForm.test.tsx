import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
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

const applyZodErrorsToAntdFormMock = jest.fn();
jest.mock(
  '@/shared/validation/antdZod',
  () => ({
    applyZodErrorsToAntdForm: (...args: any[]) => applyZodErrorsToAntdFormMock(...args),
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

const passwordSubmitMock = jest.fn();
const googleSubmitMock = jest.fn();

let passwordPending = false;
let googlePending = false;

jest.mock(
  '@/features/auth/login/model/useLoginUser',
  () => ({
    useLoginUser: () => ({ submit: passwordSubmitMock, isPending: passwordPending }),
  }),
  { virtual: true },
);

jest.mock(
  '@/features/auth/login/model/useGoogleOneTapLogin',
  () => ({
    useGoogleOneTapLogin: () => ({ submit: googleSubmitMock, isPending: googlePending }),
  }),
  { virtual: true },
);

jest.mock(
  '@/features/auth/login/ui/GoogleOneTapInit',
  () => ({
    GoogleOneTapInit: ({ disabled, onCredential }: any) => (
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

const authFetchMock = jest.fn();
jest.mock(
  '@/shared/api/authFetch',
  () => ({
    authFetch: (...args: any[]) => authFetchMock(...args),
  }),
  { virtual: true },
);

const setUserMock = jest.fn();
let storeUser: any = null;

const useSessionStoreHookMock = jest.fn((selector: any) => selector({ user: storeUser }));

jest.mock(
  '@/entities/session/model/store',
  () => ({
    useSessionStore: (selector: any) => useSessionStoreHookMock(selector),
  }),
  { virtual: true },
);

const storeModule = require('@/entities/session/model/store');
storeModule.useSessionStore.getState = () => ({ setUser: setUserMock });

jest.mock('antd', () => {
  const React = require('react');

  const message = {
    error: jest.fn(),
    success: jest.fn(),
  };

  const App = {
    useApp: () => ({ message }),
  };

  const Form = ({ form, onFinish, children }: any) => {
    return (
      <form
        data-testid="antd-form"
        onSubmit={(e) => {
          e.preventDefault();
          const values = (globalThis as any).__ANTD_FORM_VALUES__ ?? {};
          onFinish?.(values);
        }}
      >
        {children}
      </form>
    );
  };

  Form.useForm = () => {
    const f = {};
    return [f];
  };

  Form.Item = ({ name, children }: any) => {
    if (!name) return <div>{children}</div>;
    const child = React.Children.only(children);
    return <div>{React.cloneElement(child, { name })}</div>;
  };

  const Input = (props: any) => (
    <input
      data-testid={`input-${props.name ?? 'unknown'}`}
      onChange={(e) => {
        const g = (globalThis as any).__ANTD_FORM_VALUES__ ?? {};
        (globalThis as any).__ANTD_FORM_VALUES__ = { ...g, [props.name]: e.target.value };
        props.onChange?.(e);
      }}
      value={((globalThis as any).__ANTD_FORM_VALUES__ ?? {})[props.name] ?? ''}
    />
  );

  Input.Password = (props: any) => <Input {...props} />;

  const Button = ({ htmlType, loading, onClick, children, disabled }: any) => (
    <button
      type={htmlType === 'submit' ? 'submit' : 'button'}
      disabled={Boolean(loading) || Boolean(disabled)}
      onClick={onClick}
    >
      {children}
    </button>
  );

  const Typography = {
    Title: ({ children }: any) => <h2>{children}</h2>,
    Text: ({ children }: any) => <span>{children}</span>,
  };

  return {
    App,
    Form,
    Input,
    Button,
    Typography,
    __message: message,
  };
});

function setFormValues(v: any) {
  (globalThis as any).__ANTD_FORM_VALUES__ = v;
}

function getAntdMessage() {
  const antd = require('antd');
  return antd.__message as { error: jest.Mock; success: jest.Mock };
}

describe('LoginForm', () => {
  let message: { error: jest.Mock; success: jest.Mock };

  beforeEach(() => {
    replaceMock.mockReset();
    applyZodErrorsToAntdFormMock.mockReset();
    safeParseMock.mockReset();
    passwordSubmitMock.mockReset();
    googleSubmitMock.mockReset();
    authFetchMock.mockReset();
    setUserMock.mockReset();
    storeUser = null;
    passwordPending = false;
    googlePending = false;
    setFormValues({});
    message = getAntdMessage();
    message.error.mockReset();
    message.success.mockReset();
  });

  test('invalid schema applies zod errors and does not call password submit', async () => {
    safeParseMock.mockReturnValueOnce({ success: false, error: { issues: [] } });

    render(<LoginForm />);

    setFormValues({ email: 'a@b.com', password: 'x' });
    fireEvent.submit(screen.getByTestId('antd-form'));

    await waitFor(() => expect(applyZodErrorsToAntdFormMock).toHaveBeenCalledTimes(1));
    expect(passwordSubmitMock).not.toHaveBeenCalled();
  });

  test('password login shows error message on non-ok response', async () => {
    safeParseMock.mockReturnValueOnce({ success: true, data: { email: 'a@b.com', password: 'x' } });
    passwordSubmitMock.mockResolvedValueOnce({ ok: false, message: 'bad' });

    render(<LoginForm />);

    setFormValues({ email: 'a@b.com', password: 'x' });
    fireEvent.submit(screen.getByTestId('antd-form'));

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('bad'));
    expect(authFetchMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test('password login applies zodError when provided', async () => {
    safeParseMock.mockReturnValueOnce({ success: true, data: { email: 'a@b.com', password: 'x' } });
    passwordSubmitMock.mockResolvedValueOnce({ ok: false, zodError: { issues: [] } });

    render(<LoginForm />);

    setFormValues({ email: 'a@b.com', password: 'x' });
    fireEvent.submit(screen.getByTestId('antd-form'));

    await waitFor(() => expect(applyZodErrorsToAntdFormMock).toHaveBeenCalledTimes(1));
    expect(message.error).not.toHaveBeenCalled();
  });

  test('password login ok loads me, sets session user, shows success and redirects', async () => {
    safeParseMock.mockReturnValueOnce({ success: true, data: { email: 'a@b.com', password: 'x' } });
    passwordSubmitMock.mockResolvedValueOnce({ ok: true });

    const me = {
      id: 10,
      email: 'a@b.com',
      displayName: 'A',
      role: 'USER',
      authorities: [{ authority: 'ROLE_USER' }, { authority: '' }, {}],
    };

    authFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => me,
    });

    render(<LoginForm />);

    setFormValues({ email: 'a@b.com', password: 'x' });
    fireEvent.submit(screen.getByTestId('antd-form'));

    await waitFor(() => expect(setUserMock).toHaveBeenCalledTimes(1));

    expect(setUserMock.mock.calls[0][0]).toEqual({
      id: 10,
      email: 'a@b.com',
      displayName: 'A',
      role: 'USER',
      authorities: [{ authority: 'ROLE_USER' }],
    });

    expect(message.success).toHaveBeenCalledWith('Success');
    expect(replaceMock).toHaveBeenCalledWith('/me/results');
  });

  test('loadMe failure clears user and shows generic error', async () => {
    safeParseMock.mockReturnValueOnce({ success: true, data: { email: 'a@b.com', password: 'x' } });
    passwordSubmitMock.mockResolvedValueOnce({ ok: true });

    authFetchMock.mockResolvedValueOnce({
      ok: false,
    });

    render(<LoginForm />);

    setFormValues({ email: 'a@b.com', password: 'x' });
    fireEvent.submit(screen.getByTestId('antd-form'));

    await waitFor(() => expect(setUserMock).toHaveBeenCalledWith(null));
    expect(message.error).toHaveBeenCalledWith('Errors.Generic');
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test('google credential shows error on non-ok response', async () => {
    googleSubmitMock.mockResolvedValueOnce({ ok: false, message: 'nope' });

    render(<LoginForm />);

    fireEvent.click(screen.getByTestId('google-credential'));

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('nope'));
    expect(authFetchMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test('google credential ok loads me and redirects', async () => {
    googleSubmitMock.mockResolvedValueOnce({ ok: true });

    const me = {
      id: 11,
      email: 'g@b.com',
      displayName: null,
      role: null,
      authorities: [{ authority: 'ROLE_GOOGLE' }],
    };

    authFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => me,
    });

    render(<LoginForm />);

    fireEvent.click(screen.getByTestId('google-credential'));

    await waitFor(() => expect(setUserMock).toHaveBeenCalledTimes(1));

    expect(setUserMock.mock.calls[0][0]).toEqual({
      id: 11,
      email: 'g@b.com',
      displayName: undefined,
      role: undefined,
      authorities: [{ authority: 'ROLE_GOOGLE' }],
    });

    expect(message.success).toHaveBeenCalledWith('Success');
    expect(replaceMock).toHaveBeenCalledWith('/me/results');
  });
});
