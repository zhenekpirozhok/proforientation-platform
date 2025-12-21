import { useGetCurrentVersion } from "@/shared/api/generated/api";
import type { QuizVersionDto } from "@/shared/api/generated/model";

export function useCurrentQuizVersion(quizId: number) {
    return useGetCurrentVersion<QuizVersionDto>(quizId);
}

