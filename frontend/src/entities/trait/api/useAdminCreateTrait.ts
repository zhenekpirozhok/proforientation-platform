'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getGetAllQueryKey, useCreate1 } from '@/shared/api/generated/api';

export function useAdminCreateTrait() {
  const qc = useQueryClient();

  return useCreate1({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetAllQueryKey() });
      },
    },
  });
}
