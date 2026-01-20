'use client';

import { useGetById1 } from '@/shared/api/generated/api';

type UseGetById1Options = Parameters<typeof useGetById1>[1];
type UseGetById1QueryClient = Parameters<typeof useGetById1>[2];

export function useAdminQuiz(
  id: number,
  options?: UseGetById1Options,
  queryClient?: UseGetById1QueryClient,
) {
  return useGetById1(id, options, queryClient);
}
