'use client';

import { useQuery } from '@tanstack/react-query';
import type { AttemptResultDto } from '@/shared/api/generated/model';
import { getAttemptResultBff } from './client';

export function useAttemptResultQuery(attemptId: number | null) {
  const id = attemptId ?? 0;

  return useQuery({
    queryKey: ['attempt', 'result', id] as const,
    enabled: Boolean(attemptId && attemptId > 0),
    queryFn: async () => (await getAttemptResultBff(id)) as AttemptResultDto,
    staleTime: 30_000,
    retry: false,
  });
}
