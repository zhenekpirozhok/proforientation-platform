'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/entities/session/model/store';

export function useLogoutUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Logout failed (${res.status})`);
      }
      return true;
    },
    retry: false,
    onSuccess: async () => {
      useSessionStore.getState().reset();
      await qc.invalidateQueries();
    },
  });
}
