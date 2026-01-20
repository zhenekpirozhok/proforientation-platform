import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

export async function POST(req: Request, context: any) {
  // context.params may be a Promise<{id: string}> in Next dev types or a plain object in runtime.
  const maybeParams = context?.params;
  const params =
    maybeParams && typeof maybeParams.then === 'function'
      ? await maybeParams
      : maybeParams;
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
