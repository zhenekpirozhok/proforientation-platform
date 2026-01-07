import { bffFetch } from '@/shared/api/bff/proxy';
import type { LoginResponse } from '@/shared/api/generated/model';

type LoginResponseLike = {
  token?: unknown;
  refreshToken?: unknown;
  expiresIn?: unknown;
};

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function pickLoginFields(v: unknown): {
  token: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
} {
  if (typeof v !== 'object' || v === null)
    return { token: null, refreshToken: null, expiresIn: null };

  const o = v as LoginResponseLike;

  const token = typeof o.token === 'string' ? o.token : null;
  const refreshToken =
    typeof o.refreshToken === 'string' ? o.refreshToken : null;

  const expiresIn =
    typeof o.expiresIn === 'number'
      ? o.expiresIn
      : typeof o.expiresIn === 'string' && Number.isFinite(Number(o.expiresIn))
        ? Number(o.expiresIn)
        : null;

  return { token, refreshToken, expiresIn };
}

export async function POST(req: Request) {
  const body = await req.text();

  const upstreamRes = await bffFetch('/auth/google-onetap', {
    method: 'POST',
    headers: {
      'content-type': req.headers.get('content-type') ?? 'application/json',
    },
    body,
  });

  const text = await upstreamRes.text();

  if (!upstreamRes.ok) {
    return new Response(text, {
      status: upstreamRes.status,
      headers: upstreamRes.headers,
    });
  }

  const parsed: unknown = parseJson(text);

  const _typed: LoginResponse | null =
    parsed && typeof parsed === 'object' ? (parsed as LoginResponse) : null;

  const { token, refreshToken, expiresIn } = pickLoginFields(_typed);

  if (!token || !refreshToken) {
    return new Response(JSON.stringify({ message: 'Invalid login response' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const headers = new Headers();
  headers.set('content-type', 'application/json');

  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? 'Secure; ' : '';
  const sameSite = 'SameSite=Lax; ';
  const path = 'Path=/; ';
  const httpOnly = 'HttpOnly; ';

  const raw = expiresIn ?? 1800;
  const accessMaxAge = Math.max(
    60,
    raw > 10_000 ? Math.floor(raw / 1000) : raw,
  );
  const refreshMaxAge = 60 * 60 * 24 * 30;

  headers.append(
    'set-cookie',
    `cp_access=${encodeURIComponent(token)}; ${httpOnly}${secure}${sameSite}${path}Max-Age=${accessMaxAge}`,
  );
  headers.append(
    'set-cookie',
    `cp_refresh=${encodeURIComponent(refreshToken)}; ${httpOnly}${secure}${sameSite}${path}Max-Age=${refreshMaxAge}`,
  );

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
