'use client';

import { useGetQuestionsForQuizVersion } from '@/shared/api/generated/api';
import type { GetQuestionsForQuizVersionParams } from '@/shared/api/generated/model';

export function useAdminQuestionsForQuizVersion(
    quizId: number,
    version: number,
    params?: GetQuestionsForQuizVersionParams,
) {
    return useGetQuestionsForQuizVersion(quizId, version, params);
}
