import { useGetById1 } from "@/shared/api/generated/api";
import type { QuizDto } from "@/shared/api/generated/model";

export function useQuiz(quizId: number) {
  return useGetById1<QuizDto>(quizId, {
    query: {
      enabled: Number.isFinite(quizId) && quizId > 0,
    },
  });
}
