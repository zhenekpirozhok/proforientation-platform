import { parseResponse } from './parseResponse';

function makeResponse(
  opts: {
    ok: boolean;
    status?: number;
    statusText?: string;
    body?: string;
  } = { ok: true },
): Response {
  const { ok, status = ok ? 200 : 500, statusText = '', body = '' } = opts;

  const res: Partial<Response> = {
    ok,
    status,
    statusText,
    text: async () => body,
  };

  return res as Response;
}

describe('parseResponse', () => {
  test('returns parsed JSON for ok response', async () => {
    const res = makeResponse({
      ok: true,
      body: JSON.stringify({ a: 1, b: 'x' }),
    });

    await expect(parseResponse<{ a: number; b: string }>(res)).resolves.toEqual(
      {
        a: 1,
        b: 'x',
      },
    );
  });

  test('returns null when body is empty and ok', async () => {
    const res = makeResponse({ ok: true, body: '' });

    await expect(parseResponse<null>(res)).resolves.toBeNull();
  });

  test('returns raw text when body is not JSON and ok', async () => {
    const res = makeResponse({ ok: true, body: 'plain text' });

    await expect(parseResponse<string>(res)).resolves.toBe('plain text');
  });

  test('throws Error with message from JSON {message} when not ok', async () => {
    const res = makeResponse({
      ok: false,
      statusText: 'Bad Request',
      body: JSON.stringify({ message: 'Validation failed' }),
    });

    await expect(parseResponse(res)).rejects.toThrow('Validation failed');
  });

  test('throws Error with message from plain text body when not ok', async () => {
    const res = makeResponse({
      ok: false,
      statusText: 'Bad Request',
      body: 'Nope',
    });

    await expect(parseResponse(res)).rejects.toThrow('Nope');
  });

  test('throws Error with statusText when body is empty and not ok', async () => {
    const res = makeResponse({
      ok: false,
      statusText: 'Unauthorized',
      body: '',
    });

    await expect(parseResponse(res)).rejects.toThrow('Unauthorized');
  });

  test('throws Error with default message when body is empty and statusText is empty', async () => {
    const res = makeResponse({
      ok: false,
      statusText: '',
      body: '',
    });

    await expect(parseResponse(res)).rejects.toThrow('Request failed');
  });

  test('throws Error with statusText when JSON is object without message', async () => {
    const res = makeResponse({
      ok: false,
      statusText: 'Bad Request',
      body: JSON.stringify({ error: 'no message field' }),
    });

    await expect(parseResponse(res)).rejects.toThrow('Bad Request');
  });

  test('if JSON has message but it is not a string, falls back to statusText', async () => {
    const res = makeResponse({
      ok: false,
      statusText: 'Bad Request',
      body: JSON.stringify({ message: { nested: true } }),
    });

    await expect(parseResponse(res)).rejects.toThrow('Bad Request');
  });
});
