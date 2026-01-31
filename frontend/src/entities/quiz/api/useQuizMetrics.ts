import { useGetMetrics } from '@/shared/api/generated/api';

export function useQuizMetrics(quizId: number, locale?: string) {
  const enabled = Number.isFinite(quizId) && quizId > 0;

  return useGetMetrics(quizId, {
    query: {
      enabled,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      queryKey: ['quiz-metrics', quizId, locale],
    },
    request: {
      headers: locale ? { 'x-locale': locale } : undefined,
    },
  });
}
