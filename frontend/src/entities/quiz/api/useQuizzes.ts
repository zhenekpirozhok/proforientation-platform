import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { QuizDto } from '@/shared/api/generated/model';
import { orvalFetch } from '@/shared/api/orvalFetch';

type QuizzesParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
};

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

function normalizeParams(params?: QuizzesParams) {
  const pageRaw = params?.page ?? 0;
  const sizeRaw = params?.size ?? 20;

  const pageNum = typeof pageRaw === 'number' ? pageRaw : Number(pageRaw);
  const sizeNum = typeof sizeRaw === 'number' ? sizeRaw : Number(sizeRaw);

  const page = Number.isFinite(pageNum) ? Math.max(0, pageNum) : 0; // ✅ clamp
  const size = Number.isFinite(sizeNum) ? Math.max(1, sizeNum) : 20;

  const sort = params?.sort;
  const sortArr = sort ? (Array.isArray(sort) ? sort : [sort]) : [];

  return { page, size, sortArr };
}

function buildQuizzesUrl(params?: QuizzesParams) {
  const { page, size, sortArr } = normalizeParams(params);

  const sp = new URLSearchParams();
  sp.set('page', String(page));
  sp.set('size', String(size));
  for (const s of sortArr) sp.append('sort', s);

  return `/quizzes?${sp.toString()}`;
}

export function useQuizzes(params?: QuizzesParams) {
  const norm = normalizeParams(params);
  const url = buildQuizzesUrl(params);

  const queryKey = [
    '/quizzes',
    norm.page,
    norm.size,
    norm.sortArr.join('|'),
  ] as const;

  return useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      orvalFetch<Page<QuizDto>>(url, { method: 'GET', signal }),
    placeholderData: keepPreviousData,
  });
}
