'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getGetAll3QueryKey, useCreate6 } from '@/shared/api/generated/api';

export function useAdminCreateCategory() {
  const qc = useQueryClient();
  const key = getGetAll3QueryKey();

  return useCreate6({
    mutation: {
      onSuccess: async () => {
        await qc.refetchQueries({ queryKey: key, type: 'active' });
        qc.invalidateQueries({ queryKey: key });
      },
    },
  });
}
