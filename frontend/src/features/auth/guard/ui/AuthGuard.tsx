'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from '@/shared/i18n/lib/navigation';
import { useRouter } from '@/shared/i18n/lib/navigation';
import { useSessionStore } from '@/entities/session/model/store';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AuthGuard({ children, fallback = null }: Props) {
  const router = useRouter();
  const status = useSessionStore((s) => s.status);
    const user = useSessionStore((s) => s.user);
    const pathname = usePathname();

  useEffect(() => {
    if (status === 'guest') router.replace(`/login`);
  }, [status, router]);

  useEffect(() => {
  console.log('[AuthGuard]', { pathname, status, hasUser: Boolean(user) })
}, [pathname, status, user])


  if (status === 'unknown') return <>{fallback}</>;
  if (status === 'guest') return <>{fallback}</>;
  return <>{children}</>;
}
