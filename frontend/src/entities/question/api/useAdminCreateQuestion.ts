'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
    getGetQuestionsForQuizVersionQueryKey,
    useCreate3,
} from '@/shared/api/generated/api';
import { useCurrentQuizVersion } from '@/entities/quiz/api/useCurrentQuizVersion';
import type { CreateQuestionRequest } from '@/shared/api/generated/model';

export function useAdminCreateQuestion(quizId: number, version: number) {
    const qc = useQueryClient();
    const { data: currentVersion } = useCurrentQuizVersion(quizId);

    const baseMutation = useCreate3({
        mutation: {
            onSuccess: () => {
                qc.invalidateQueries({
                    queryKey: getGetQuestionsForQuizVersionQueryKey(quizId, version),
                });
            },
        },
    });

    return {
        ...baseMutation,
        mutateAsync: async (variables: { data: CreateQuestionRequest }, ...args: any[]) => {
            const quizVersionId = currentVersion?.id ?? (variables.data as any).quizVersionId;
            const enhancedVariables = {
                data: {
                    ...variables.data,
                    quizVersionId: quizVersionId || variables.data.quizVersionId,
                },
            };
            return baseMutation.mutateAsync(enhancedVariables, ...args);
        },
    };
}
