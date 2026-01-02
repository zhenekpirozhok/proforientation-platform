import { useMemo } from 'react';
import type {
  QuizDto,
  QuizPublicMetricsView,
  QuizVersionDto,
} from '@/shared/api/generated/model';
import { useQuiz } from './useQuiz';
import { useQuizMetrics } from './useQuizMetrics';
import { useCurrentQuizVersion } from './useCurrentQuizVersion';

export type QuizDetailsAggregate = {
  quiz: QuizDto | null;
  metrics: QuizPublicMetricsView | null;
  version: QuizVersionDto | null;

  questionCount: number | null;
  estimatedMinutes: number | null;

  isLoading: boolean;
  error: unknown;

  refetchAll: () => void;
};

export function useQuizDetails(quizId: number): QuizDetailsAggregate {
  const quizQ = useQuiz(quizId);
  const metricsQ = useQuizMetrics(quizId);
  const versionQ = useCurrentQuizVersion(quizId);

  const isLoading = quizQ.isLoading || metricsQ.isLoading || versionQ.isLoading;

  const error = quizQ.error || metricsQ.error || versionQ.error;

  const questionCount = useMemo(() => {
    const n = metricsQ.data?.questionsTotal;
    return typeof n === 'number' ? n : null;
  }, [metricsQ.data?.questionsTotal]);

  const estimatedMinutes = useMemo(() => {
    const sec = metricsQ.data?.estimatedDurationSeconds;
    return typeof sec === 'number' ? Math.max(1, Math.round(sec / 60)) : null;
  }, [metricsQ.data?.estimatedDurationSeconds]);

  return {
    quiz: quizQ.data ?? null,
    metrics: metricsQ.data ?? null,
    version: versionQ.data ?? null,

    questionCount,
    estimatedMinutes,

    isLoading,
    error,

    refetchAll: () => {
      quizQ.refetch();
      metricsQ.refetch();
      versionQ.refetch();
    },
  };
}
