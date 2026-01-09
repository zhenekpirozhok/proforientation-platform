import React from 'react';
import { render, act } from '@testing-library/react';
import { GoogleOneTapInit } from './GoogleOneTapInit';

function flush() {
  return act(async () => {
    await Promise.resolve();
  });
}

type GoogleIdConfig = {
  client_id: string;
  callback: (res: { credential: string }) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
};

type GoogleAccounts = {
  id: {
    initialize: (cfg: GoogleIdConfig) => void;
    prompt: () => void;
    cancel: () => void;
    disableAutoSelect: () => void;
  };
};

declare global {
  interface Window {
    __gsiScriptPromise?: Promise<void>;
    __gsiInitialized?: boolean;
    __gsiPrompting?: boolean;
    __gsiDisabled?: boolean;
  }
}

describe('GoogleOneTapInit', () => {
  let initializeMock: jest.Mock<void, [GoogleIdConfig]>;
  let promptMock: jest.Mock<void, []>;
  let cancelMock: jest.Mock<void, []>;
  let disableAutoSelectMock: jest.Mock<void, []>;

  beforeEach(() => {
    initializeMock = jest.fn();
    promptMock = jest.fn();
    cancelMock = jest.fn();
    disableAutoSelectMock = jest.fn();

    const googleObj: { accounts?: GoogleAccounts } = {
      accounts: {
        id: {
          initialize: initializeMock,
          prompt: promptMock,
          cancel: cancelMock,
          disableAutoSelect: disableAutoSelectMock,
        },
      },
    };

    window.google = googleObj;

    delete window.__gsiScriptPromise;
    delete window.__gsiInitialized;
    delete window.__gsiPrompting;
    delete window.__gsiDisabled;

    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'cid';

    jest
      .spyOn(document.head, 'appendChild')
      .mockImplementation((node: Node) => {
        const script = node as HTMLScriptElement;
        queueMicrotask(() => script.onload?.(new Event('load')));
        return node;
      });
  });

  afterEach(() => {
    (document.head.appendChild as unknown as jest.Mock).mockRestore?.();
    delete window.google;
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  });

  test('does nothing when disabled', async () => {
    const onCredential = jest.fn<void, [string]>();
    render(<GoogleOneTapInit disabled onCredential={onCredential} />);
    await flush();

    expect(initializeMock).not.toHaveBeenCalled();
    expect(promptMock).not.toHaveBeenCalled();
    expect(document.head.appendChild).not.toHaveBeenCalled();
  });

  test('does nothing when client id is missing', async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const onCredential = jest.fn<void, [string]>();
    render(<GoogleOneTapInit onCredential={onCredential} />);
    await flush();

    expect(initializeMock).not.toHaveBeenCalled();
    expect(promptMock).not.toHaveBeenCalled();
  });

  test('initializes once and prompts', async () => {
    const onCredential = jest.fn<void, [string]>();
    render(<GoogleOneTapInit onCredential={onCredential} />);
    await flush();
    await flush();

    expect(initializeMock).toHaveBeenCalledTimes(1);
    const cfg = initializeMock.mock.calls[0][0];
    expect(cfg.client_id).toBe('cid');
    expect(typeof cfg.callback).toBe('function');
    expect(cfg.auto_select).toBe(false);
    expect(cfg.cancel_on_tap_outside).toBe(false);
    expect(cfg.use_fedcm_for_prompt).toBe(true);

    expect(promptMock).toHaveBeenCalledTimes(1);
    expect(window.__gsiInitialized).toBe(true);
  });

  test('does not re-run effect on re-render with same props', async () => {
    const onCredential = jest.fn<void, [string]>();
    const r = render(<GoogleOneTapInit onCredential={onCredential} />);
    await flush();
    await flush();

    expect(initializeMock).toHaveBeenCalledTimes(1);
    expect(promptMock).toHaveBeenCalledTimes(1);

    r.rerender(<GoogleOneTapInit onCredential={onCredential} />);
    await flush();
    await flush();

    expect(initializeMock).toHaveBeenCalledTimes(1);
    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  test('credential callback disables and calls onCredential', async () => {
    const onCredential = jest.fn<void, [string]>();
    render(<GoogleOneTapInit onCredential={onCredential} />);
    await flush();
    await flush();

    const cfg = initializeMock.mock.calls[0][0];
    cfg.callback({ credential: 'tok' });

    expect(window.__gsiDisabled).toBe(true);
    expect(cancelMock).toHaveBeenCalledTimes(1);
    expect(disableAutoSelectMock).toHaveBeenCalledTimes(1);
    expect(onCredential).toHaveBeenCalledWith('tok');
  });

  test('empty credential does nothing', async () => {
    const onCredential = jest.fn<void, [string]>();
    render(<GoogleOneTapInit onCredential={onCredential} />);
    await flush();
    await flush();

    const cfg = initializeMock.mock.calls[0][0];
    cfg.callback({ credential: '' });

    expect(window.__gsiDisabled).toBeUndefined();
    expect(cancelMock).not.toHaveBeenCalled();
    expect(disableAutoSelectMock).not.toHaveBeenCalled();
    expect(onCredential).not.toHaveBeenCalled();
  });

  test('respects __gsiDisabled flag', async () => {
    window.__gsiDisabled = true;
    const onCredential = jest.fn<void, [string]>();
    render(<GoogleOneTapInit onCredential={onCredential} />);
    await flush();

    expect(initializeMock).not.toHaveBeenCalled();
    expect(promptMock).not.toHaveBeenCalled();
  });

  test('does not prompt when already prompting', async () => {
    window.__gsiPrompting = true;
    const onCredential = jest.fn<void, [string]>();
    render(<GoogleOneTapInit onCredential={onCredential} />);
    await flush();

    expect(initializeMock).toHaveBeenCalledTimes(1);
    expect(promptMock).not.toHaveBeenCalled();
  });
});
