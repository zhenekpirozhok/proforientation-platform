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
