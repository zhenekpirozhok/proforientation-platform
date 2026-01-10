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

require('whatwg-fetch');

Object.assign(globalThis, {
  fetch: (globalThis as any).fetch,
  Headers: (globalThis as any).Headers,
  Request: (globalThis as any).Request,
  Response: (globalThis as any).Response,
});

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));
