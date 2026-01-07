'use client';

import { useEffect } from 'react';
import { useRouter } from '@/shared/i18n/lib/navigation';
import { useSessionStore } from '@/entities/session/model/store';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AuthGuard({ children, fallback = null }: Props) {
  const router = useRouter();
  const status = useSessionStore((s) => s.status);

  useEffect(() => {
    if (status === 'guest') router.replace(`/login`);
  }, [status, router]);

  if (status === 'unknown') return <>{fallback}</>;
  if (status === 'guest') return <>{fallback}</>;
  return <>{children}</>;
}
