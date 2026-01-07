'use client';

import { useQuery } from '@tanstack/react-query';
import type { QuizDto } from '@/shared/api/generated/model';

type SearchQuizzesParams = {
  search?: string;
  sortBy?: string;
  page?: number;
  size?: number;
};

type MessageEnvelope = { message?: unknown };

function tryGetMessage(v: unknown): string | null {
  if (typeof v !== 'object' || v === null) return null;
  if (!('message' in v)) return null;
  const msg = (v as MessageEnvelope).message;
  return typeof msg === 'string' ? msg : null;
}

function buildSearchParams(params: SearchQuizzesParams): URLSearchParams {
  const sp = new URLSearchParams();

  if (typeof params.search === 'string' && params.search.trim())
    sp.set('search', params.search.trim());
  if (typeof params.sortBy === 'string' && params.sortBy.trim())
    sp.set('sortBy', params.sortBy.trim());
  if (typeof params.page === 'number' && Number.isFinite(params.page))
    sp.set('page', String(params.page));
  if (typeof params.size === 'number' && Number.isFinite(params.size))
    sp.set('size', String(params.size));

  return sp;
}

export function useSearchQuizzesLocalized(
  locale: string,
  params?: SearchQuizzesParams,
) {
  return useQuery({
    queryKey: ['quizzes-search', locale, params ?? null],
    enabled: Boolean(params),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      if (!params) throw new Error('Missing params');

      const sp = buildSearchParams(params);

      const res = await fetch(`/api/quizzes/search?${sp.toString()}`, {
        method: 'GET',
        headers: { 'x-locale': locale },
        credentials: 'include',
        cache: 'no-store',
        signal,
      });

      const text = await res.text().catch(() => '');
      const data: unknown = text
        ? (() => {
            try {
              return JSON.parse(text) as unknown;
            } catch {
              return text;
            }
          })()
        : null;

      if (!res.ok) {
        const msg = tryGetMessage(data);
        throw new Error(
          msg ??
            (typeof data === 'string'
              ? data
              : `Request failed (${res.status})`),
        );
      }

      return data as QuizDto[];
    },
  });
}
