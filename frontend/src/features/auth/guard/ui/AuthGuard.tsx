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
  const pathname = usePathname();
  const status = useSessionStore((s) => s.status);

  const next = useMemo(() => encodeURIComponent(pathname || '/'), [pathname]);

  useEffect(() => {
    if (status === 'guest') router.replace(`/login?next=${next}`);
  }, [status, router, next]);

  if (status === 'unknown') return <>{fallback}</>;
  if (status === 'guest') return <>{fallback}</>;
  return <>{children}</>;
}
