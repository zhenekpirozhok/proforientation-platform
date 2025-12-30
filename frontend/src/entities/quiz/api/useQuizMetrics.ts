import { useGetMetrics } from "@/shared/api/generated/api";
import type { QuizPublicMetricsView } from "@/shared/api/generated/model";

export function useQuizMetrics(quizId: number) {
    return useGetMetrics<QuizPublicMetricsView>(quizId, {
        query: {
            enabled: Number.isFinite(quizId) && quizId > 0,
            staleTime: 60_000,
            gcTime: 5 * 60_000,
        },
    });
}
