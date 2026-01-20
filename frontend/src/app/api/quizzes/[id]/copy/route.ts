import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function POST(req: Request, context: unknown) {
  // context.params may be a Promise<{id: string}> in Next dev types or a plain object in runtime.
  const maybeParams = (context as Record<string, unknown> | null | undefined)
    ?.params;
  let params: Record<string, unknown> | undefined;
  if (
    maybeParams &&
    typeof maybeParams === 'object' &&
    'then' in maybeParams &&
    typeof (maybeParams as { then?: unknown }).then === 'function'
  ) {
    params = await (maybeParams as Promise<Record<string, unknown>>);
  } else {
    params = maybeParams as Record<string, unknown> | undefined;
  }
  const id = params?.id;
  const upstream = await bffAuthFetch(`/quizzes/${id}/copy`, {
    method: 'POST',
    headers: {
      accept: req.headers.get('accept') ?? 'application/json',
    },
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}
