'use client';

import { useEffect } from 'react';
import { useAuthenticatedUser } from '@/shared/api/generated/api';
import {
  useSessionStore,
  type SessionUser,
} from '@/entities/session/model/store';
import type { User, GrantedAuthority } from '@/shared/api/generated/model';

function normalizeAuthorities(
  a?: GrantedAuthority[],
): Array<{ authority: string }> | undefined {
  if (!a?.length) return undefined;

  const list = a
    .map((x) => (typeof x.authority === 'string' ? x.authority : null))
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .map((authority) => ({ authority }));

  return list.length ? list : undefined;
}

function toSessionUser(u: User): SessionUser | null {
  if (typeof u.id !== 'number') return null;

  return {
    id: u.id,
    email: u.email ?? '',
    displayName: u.displayName ?? undefined,
    role: u.role ?? undefined,
    authorities: normalizeAuthorities(u.authorities),
  };
}

export function useSessionBootstrap() {
  const setUser = useSessionStore((s) => s.setUser);

  const q = useAuthenticatedUser({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  });

  useEffect(() => {
    if (q.isLoading) return;

    if (q.isSuccess) {
      setUser(q.data ? toSessionUser(q.data) : null);
      return;
    }

    setUser(null);
  }, [q.isLoading, q.isSuccess, q.data, setUser]);

  return q;
}
