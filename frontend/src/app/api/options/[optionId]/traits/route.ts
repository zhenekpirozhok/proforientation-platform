import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

type Params = { optionId?: string | number };
type Ctx = { params: Promise<Params> };

async function getParams(ctx: Ctx): Promise<Params> {
  return await ctx.params;
}

function toValidId(raw: unknown): string | null {
  const id = raw !== undefined && raw !== null ? String(raw) : '';
  if (!id || Number.isNaN(Number(id))) return null;
  return id;
}

function bad(raw: unknown) {
  return new Response(
    JSON.stringify({
      code: 400,
      message: 'Invalid value for parameter "optionId": ' + String(raw),
    }),
    { status: 400, headers: { 'content-type': 'application/json' } },
  );
}

export async function GET(req: Request, ctx: Ctx) {
  const params = await getParams(ctx);
  const optionId = toValidId(params.optionId);
  if (!optionId) return bad(params.optionId);

  const upstream = await bffAuthFetch(`/options/${optionId}/traits`, {
    method: 'GET',
    headers: { accept: req.headers.get('accept') ?? 'application/json' },
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const params = await getParams(ctx);
  const optionId = toValidId(params.optionId);
  if (!optionId) return bad(params.optionId);

  const upstream = await bffAuthFetch(`/options/${optionId}/traits`, {
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
