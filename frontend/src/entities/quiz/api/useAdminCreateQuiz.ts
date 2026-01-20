'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getGetAll1QueryKey, useCreate2 } from '@/shared/api/generated/api';

export function useAdminCreateQuiz() {
  const qc = useQueryClient();

  return useCreate2({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetAll1QueryKey() });
      },
    },
  });
}
