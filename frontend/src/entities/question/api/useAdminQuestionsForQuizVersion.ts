'use client';

import { useGetQuestionsForQuizVersion } from '@/shared/api/generated/api';
import type { GetQuestionsForQuizVersionParams } from '@/shared/api/generated/model';

export function useAdminQuestionsForQuizVersion(
    quizId?: number,
    version?: number,
    params?: GetQuestionsForQuizVersionParams,
) {
    const enabled =
        typeof quizId === 'number' && quizId > 0 && typeof version === 'number' && version > 0;

    return useGetQuestionsForQuizVersion(
        enabled ? quizId : 0,
        enabled ? version : 0,
        params ?? ({ page: 0, size: 200, sort: 'ord' } as any),
        { query: { enabled } } as any,
    ) as any;
}
