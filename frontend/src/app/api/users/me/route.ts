import { bffAuthFetch } from '@/shared/api/bffAuthFetch';

type UserLike = {
  password?: unknown;
  passwordHash?: unknown;
  [key: string]: unknown;
};

function stripSensitiveFields(v: unknown): unknown {
  if (typeof v !== 'object' || v === null) return v;

  const obj: UserLike = { ...(v as Record<string, unknown>) };
  delete obj.password;
  delete obj.passwordHash;
  return obj;
}

export async function GET() {
  const upstreamRes = await bffAuthFetch('/users/me', { method: 'GET' });

  const text = await upstreamRes.text();

  if (!upstreamRes.ok) {
    return new Response(text, {
      status: upstreamRes.status,
      headers: upstreamRes.headers,
    });
  }

  let data: unknown = null;
  try {
    data = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    data = null;
  }

  const safeData = stripSensitiveFields(data);

  return new Response(JSON.stringify(safeData), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
