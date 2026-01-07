'use client';

import type { SearchQuizzesParams } from '@/shared/api/generated/model';
import { useSearchQuizzes } from '@/shared/api/generated/api';

export function useSearchQuizzesLocalized(
  locale: string,
  params?: SearchQuizzesParams,
) {
  return useSearchQuizzes(params, {
    request: {
      headers: {
        'x-locale': locale,
      },
    },
    query: {
      queryKey: ['quizzes-search', locale, params ?? null],
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      enabled: !!params,
      placeholderData: (prev) => prev,
      refetchOnWindowFocus: false,
    },
  });
}
