import { useGetById } from "@/shared/api/generated/api";
import type { QuizDto } from "@/shared/api/generated/model";

export function useQuiz(quizId: number) {
    return useGetById<QuizDto>(quizId);
}
