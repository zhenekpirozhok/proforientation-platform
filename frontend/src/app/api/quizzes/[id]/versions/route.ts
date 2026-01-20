import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

type Ctx = { params: Promise<{ id: string }> };

async function getId(ctx: Ctx): Promise<string | null> {
  const params = await ctx.params;
  const raw = params?.id;
  const id = raw !== undefined && raw !== null ? String(raw) : '';
  if (!id || Number.isNaN(Number(id))) return null;
  return id;
}

function badIdResponse(raw: unknown) {
  return new Response(
    JSON.stringify({
      code: 400,
      message: 'Invalid value for parameter "id": ' + String(raw),
    }),
    { status: 400, headers: { 'content-type': 'application/json' } },
  );
}

export async function GET(req: Request, ctx: Ctx) {
  const params = await ctx.params;
  const id = await getId(ctx);
  if (!id) return badIdResponse(params?.id);

  const upstream = await bffAuthFetch(`/quizzes/${id}/versions`, {
    method: 'GET',
    headers: { accept: req.headers.get('accept') ?? 'application/json' },
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const params = await ctx.params;
  const id = await getId(ctx);
  if (!id) return badIdResponse(params?.id);

  const upstream = await bffAuthFetch(`/quizzes/${id}/versions`, {
    method: 'POST',
    headers: {
      'content-type': req.headers.get('content-type') ?? 'application/json',
      accept: req.headers.get('accept') ?? 'application/json',
    },
    body: await req.text(),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}
