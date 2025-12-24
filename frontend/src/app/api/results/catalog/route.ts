import { bffFetch } from '@/shared/api/bff/proxy';
import { parseResponse } from '@/shared/api/parseResponse';

type QuizDto = {
  id?: number;
  categoryId?: number;
  code?: string;
  title?: string;
};

type TraitDto = {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
};

type ProfessionDto = {
  id?: number;
  name?: string;
  description?: string;
  categoryId?: number;
};

type PageLike<T> = {
  content?: T[];
  totalElements?: number;
  last?: boolean;
  number?: number; // page index
};

async function fetchJsonOrThrow<T>(res: Response, tag: string) {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${tag} failed: ${res.status} ${body}`);
  }
  return parseResponse<T>(res);
}

async function fetchAllProfessions(headers?: Record<string, string>) {
  const out: ProfessionDto[] = [];
  let page = 0;
  const size = 200;

  for (let guard = 0; guard < 200; guard++) {
    const sp = new URLSearchParams({
      page: String(page),
      size: String(size),
      // Если твой бэк не поддерживает sort — убери эту строку
      sort: 'id,asc',
    });

    const res = await bffFetch(`/professions?${sp.toString()}`, {
      method: 'GET',
      headers,
    });

    // если бэк вернул ошибку — покажем её наверх
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`/professions failed: ${res.status} ${body}`);
    }

    const data = await parseResponse<PageLike<ProfessionDto> | ProfessionDto[]>(
      res,
    );

    if (Array.isArray(data)) {
      out.push(...data);
      break;
    }

    out.push(...(data.content ?? []));

    if (data.last === true) break;

    // на всякий случай — если number отсутствует
    page = typeof data.number === 'number' ? data.number + 1 : page + 1;
  }

  return out;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const quizId = Number(url.searchParams.get('quizId'));

    if (!Number.isFinite(quizId) || quizId <= 0) {
      return new Response(JSON.stringify({ message: 'quizId is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const locale = req.headers.get('x-locale') ?? undefined;
    const headers = locale ? { 'x-locale': locale } : undefined;

    // 1) quiz -> categoryId
    const quizRes = await bffFetch(`/quizzes/${quizId}`, {
      method: 'GET',
      headers,
    });
    const quiz = await fetchJsonOrThrow<QuizDto>(quizRes, `/quizzes/${quizId}`);

    const categoryId = quiz.categoryId;
    if (!Number.isFinite(categoryId)) {
      return new Response(
        JSON.stringify({ message: 'Quiz categoryId is missing', quiz }),
        {
          status: 502,
          headers: { 'content-type': 'application/json' },
        },
      );
    }

    // 2) traits
    const traitsRes = await bffFetch(`/traits`, { method: 'GET', headers });
    const traits = await fetchJsonOrThrow<TraitDto[]>(traitsRes, `/traits`);

    // 3) professions (all pages) -> filter by categoryId
    const allProfessions = await fetchAllProfessions(headers);
    const professions = allProfessions.filter(
      (p) => p.categoryId === categoryId,
    );

    return new Response(
      JSON.stringify({
        quizId,
        categoryId,
        traits,
        professions,
        debug: {
          traitsCount: traits.length,
          professionsTotal: allProfessions.length,
          professionsInCategory: professions.length,
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const stack = e instanceof Error ? e.stack : undefined;

    return new Response(JSON.stringify({ message: msg, stack }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
