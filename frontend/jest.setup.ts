import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream, WritableStream, TransformStream } from 'stream/web';
import { MessageChannel, MessagePort } from 'worker_threads';

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
  ReadableStream,
  WritableStream,
  TransformStream,
  MessageChannel,
  MessagePort,
});

if (
  !globalThis.fetch ||
  !globalThis.Request ||
  !globalThis.Response ||
  !globalThis.Headers
) {
  throw new Error(
    'Fetch API globals are missing. Ensure tests run on Node >= 18 (preferably Node 20).',
  );
}

Object.assign(globalThis, {
  fetch: globalThis.fetch,
  Request: globalThis.Request,
  Response: globalThis.Response,
  Headers: globalThis.Headers,
});

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));
