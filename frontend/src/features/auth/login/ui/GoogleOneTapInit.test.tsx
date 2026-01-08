import { render, act } from '@testing-library/react';
import { GoogleOneTapInit } from './GoogleOneTapInit';

function flush() {
  return act(async () => {
    await Promise.resolve();
  });
}

describe('GoogleOneTapInit', () => {
  let initializeMock: jest.Mock;
  let promptMock: jest.Mock;
  let cancelMock: jest.Mock;
  let disableAutoSelectMock: jest.Mock;

  beforeEach(() => {
    initializeMock = jest.fn();
    promptMock = jest.fn();
    cancelMock = jest.fn();
    disableAutoSelectMock = jest.fn();

    (window as any).google = {
      accounts: {
        id: {
          initialize: initializeMock,
          prompt: promptMock,
          cancel: cancelMock,
          disableAutoSelect: disableAutoSelectMock,
        },
      },
    };

    delete (window as any).__gsiScriptPromise;
    delete (window as any).__gsiInitialized;
    delete (window as any).__gsiPrompting;
    delete (window as any).__gsiDisabled;

    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'cid';

    jest.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
      queueMicrotask(() => {
        if (typeof node.onload === 'function') node.onload();
      });
      return node;
    });
  });

  afterEach(() => {
    (document.head.appendChild as any).mockRestore?.();
    delete (window as any).google;
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  });

  test('does nothing when disabled', async () => {
    const onCredential = jest.fn();
    render(<GoogleOneTapInit disabled onCredential={onCredential} />);
    await flush();

    expect(initializeMock).not.toHaveBeenCalled();
    expect(promptMock).not.toHaveBeenCalled();
    expect(document.head.appendChild).not.toHaveBeenCalled();
  });

  test('does nothing when client id is missing', async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const onCredential = jest.fn();
    render(<GoogleOneTapInit onCredential={onCredential} />);
    await flush();

    expect(initializeMock).not.toHaveBeenCalled();
    expect(promptMock).not.toHaveBeenCalled();
  });

  test('initializes once and prompts', async () => {
    const onCredential = jest.fn();
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
    expect((window as any).__gsiInitialized).toBe(true);
  });

test('does not re-run effect on re-render with same props', async () => {
  const onCredential = jest.fn();
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
    const onCredential = jest.fn();
    render(<GoogleOneTapInit onCredential={onCredential} />);

    await flush();
    await flush();

    const cfg = initializeMock.mock.calls[0][0];
    cfg.callback({ credential: 'tok' });

    expect((window as any).__gsiDisabled).toBe(true);
    expect(cancelMock).toHaveBeenCalledTimes(1);
    expect(disableAutoSelectMock).toHaveBeenCalledTimes(1);
    expect(onCredential).toHaveBeenCalledWith('tok');
  });

  test('empty credential does nothing', async () => {
    const onCredential = jest.fn();
    render(<GoogleOneTapInit onCredential={onCredential} />);

    await flush();
    await flush();

    const cfg = initializeMock.mock.calls[0][0];
    cfg.callback({ credential: '' });

    expect((window as any).__gsiDisabled).toBeUndefined();
    expect(cancelMock).not.toHaveBeenCalled();
    expect(disableAutoSelectMock).not.toHaveBeenCalled();
    expect(onCredential).not.toHaveBeenCalled();
  });

  test('respects __gsiDisabled flag', async () => {
    (window as any).__gsiDisabled = true;

    const onCredential = jest.fn();
    render(<GoogleOneTapInit onCredential={onCredential} />);

    await flush();
    await flush();

    expect(initializeMock).not.toHaveBeenCalled();
    expect(promptMock).not.toHaveBeenCalled();
  });

  test('does not prompt when already prompting', async () => {
    (window as any).__gsiPrompting = true;

    const onCredential = jest.fn();
    render(<GoogleOneTapInit onCredential={onCredential} />);

    await flush();
    await flush();

    expect(initializeMock).toHaveBeenCalledTimes(1);
    expect(promptMock).not.toHaveBeenCalled();
  });
});
