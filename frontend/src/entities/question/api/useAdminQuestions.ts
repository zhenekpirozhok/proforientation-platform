'use client';

import { useGetQuestionsForQuiz } from '@/shared/api/generated/api';
import type { GetQuestionsForQuizParams } from '@/shared/api/generated/model';

export function useAdminQuestions(quizId: number, params?: GetQuestionsForQuizParams) {
    return useGetQuestionsForQuiz(quizId, params);
}
