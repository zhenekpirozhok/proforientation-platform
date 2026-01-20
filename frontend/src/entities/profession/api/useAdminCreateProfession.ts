'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getGetAll2QueryKey, useCreate4 } from '@/shared/api/generated/api';

export function useAdminCreateProfession() {
  const qc = useQueryClient();
  const key = getGetAll2QueryKey();

  return useCreate4({
    mutation: {
      onSuccess: async () => {
        await qc.refetchQueries({ queryKey: key, type: 'active' });
        qc.invalidateQueries({ queryKey: key });
      },
    },
  });
}
