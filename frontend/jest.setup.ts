import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream, WritableStream, TransformStream } from 'stream/web';
import { MessageChannel, MessagePort } from 'worker_threads';
import 'whatwg-fetch';

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
  ReadableStream,
  WritableStream,
  TransformStream,
  MessageChannel,
  MessagePort,
});

type FetchGlobals = {
  fetch: typeof fetch;
  Headers: typeof Headers;
  Request: typeof Request;
  Response: typeof Response;
};

const g = globalThis as unknown as Partial<FetchGlobals>;

Object.assign(globalThis, {
  fetch: g.fetch,
  Headers: g.Headers,
  Request: g.Request,
  Response: g.Response,
});

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));
