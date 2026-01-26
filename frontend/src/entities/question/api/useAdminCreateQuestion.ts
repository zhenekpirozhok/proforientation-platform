'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  getGetQuestionsForQuizVersionQueryKey,
  useCreate3,
} from '@/shared/api/generated/api';
import type { CreateQuestionRequest } from '@/shared/api/generated/model';
import { useAdminQuizBuilderStore } from '@/features/admin-quiz-builder/model/store';

function toNum(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function useAdminCreateQuestion(quizId: number, quizVersionId: number) {
  const qc = useQueryClient();
  const storeQuizVersionId = useAdminQuizBuilderStore((s) => s.quizVersionId);

  const baseMutation = useCreate3({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: getGetQuestionsForQuizVersionQueryKey(
            quizId,
            quizVersionId,
          ),
        });
      },
    },
  });

  return {
    ...baseMutation,
    mutateAsync: async (
      variables: { data: CreateQuestionRequest },
      ...args: unknown[]
    ) => {
      const fromStore = toNum(storeQuizVersionId);
      const dataRecord = variables.data as unknown as Record<string, unknown>;
      const fromArgs = toNum(dataRecord.quizVersionId);
      const effective = fromStore ?? toNum(quizVersionId) ?? fromArgs;

      if (typeof effective !== 'number') {
        throw new Error(
          'Missing quizVersionId: create a draft version before creating questions',
        );
      }

      return baseMutation.mutateAsync(
        {
          data: {
            ...variables.data,
            quizVersionId: effective,
          },
        },
        ...(args as []),
      );
    },
  };
}
