import { orvalFetch } from '@/shared/api/orvalFetch';
import { useQuery } from '@tanstack/react-query';
import { AttemptViewDto } from '../model/types';

export function useAttemptViewQuery(attemptId: number | null) {
  return useQuery({
    enabled: typeof attemptId === 'number' && attemptId > 0,
    queryKey: ['attempt-view', attemptId],
    queryFn: async () => {
      return orvalFetch<AttemptViewDto>(`/attempts/${attemptId}/view`);
    },
  });
}
