'use client';

import { useGetAdminQuizzes } from '@/shared/api/generated/api';
import type { GetAdminQuizzesParams } from '@/shared/api/generated/model';

export function useAdminQuizzes(
  params?: GetAdminQuizzesParams,
  locale?: string,
) {
  const request = locale ? { headers: { 'x-locale': locale } } : undefined;
  const query = {
    queryKey: ['getAdminQuizzes', params ?? {}, locale],
  } as Record<string, unknown>;
  return useGetAdminQuizzes(params, { query, request });
}
