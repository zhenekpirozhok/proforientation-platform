'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getGetAll1QueryKey, getGetAllQueryKey, useCreate2 } from '@/shared/api/generated/api';

export function useAdminCreateQuiz() {
  const qc = useQueryClient();

  return useCreate2({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetAll1QueryKey() });
        qc.invalidateQueries({ queryKey: getGetAllQueryKey() });
        qc.invalidateQueries({ queryKey: ['/quizzes/my'] });
      },
    },
  });
}
