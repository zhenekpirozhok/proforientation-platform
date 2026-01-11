'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
    getGetQuestionsForQuizVersionQueryKey,
    useCreate3,
} from '@/shared/api/generated/api';

export function useAdminCreateQuestion(quizId: number, version: number) {
    const qc = useQueryClient();

    return useCreate3({
        mutation: {
            onSuccess: () => {
                qc.invalidateQueries({
                    queryKey: getGetQuestionsForQuizVersionQueryKey(quizId, version),
                });
            },
        },
    });
}
