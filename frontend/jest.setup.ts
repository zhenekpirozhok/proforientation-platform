import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream, WritableStream, TransformStream } from 'stream/web';

Object.assign(globalThis, {
    TextDecoder,
    TextEncoder,
    ReadableStream,
    WritableStream,
    TransformStream,
});

import { fetch, Headers, Request, Response } from 'undici';

Object.assign(globalThis, {
    fetch,
    Headers,
    Request,
    Response,
});
