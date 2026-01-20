'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  getGetQuestionsForQuizVersionQueryKey,
  useUpdate3,
} from '@/shared/api/generated/api';

export function useAdminUpdateQuestion(quizId: number, version: number) {
  const qc = useQueryClient();

  return useUpdate3({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: getGetQuestionsForQuizVersionQueryKey(quizId, version),
        });
      },
    },
  });
}
