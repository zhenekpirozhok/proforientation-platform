'use client';

import { useSearch1 } from '@/shared/api/generated/api';
import type { Search1Params } from '@/shared/api/generated/model';

export function useSearchQuizzesLocalized(
  locale: string,
  params?: Search1Params,
) {
  return useSearch1(params, {
    query: {
      enabled: Boolean(params),
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      placeholderData: (prev) => prev,
      refetchOnWindowFocus: false,
    },
    request: {
      headers: { 'x-locale': locale },
      credentials: 'include',
      cache: 'no-store',
    },
  });
}
