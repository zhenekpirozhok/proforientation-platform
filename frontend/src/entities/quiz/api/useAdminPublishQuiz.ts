'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getGetAll1QueryKey, usePublish } from '@/shared/api/generated/api';

export function useAdminPublishQuiz() {
  const qc = useQueryClient();

  return usePublish({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetAll1QueryKey() });
        qc.invalidateQueries();
      },
    },
  });
}
