'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from '@/shared/i18n/lib/navigation';
import { useRouter } from '@/shared/i18n/lib/navigation';
import { useSessionStore } from '@/entities/session/model/store';
import { hasRole, hasAuthority } from '@/entities/session/model/roles';

type Props = {
  require?: { roles?: string[]; authorities?: string[] };
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onDenied?: 'redirect-home' | 'redirect-login' | 'render-fallback';
};

export function RoleGuard({
  require,
  children,
  fallback = null,
  onDenied = 'redirect-home',
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);

  const next = useMemo(() => encodeURIComponent(pathname || '/'), [pathname]);

  const allowed = useMemo(() => {
    if (!require) return true;
    if (!user) return false;

    const okRoles =
      !require.roles?.length || require.roles.some((r) => hasRole(user, r));
    const okAuth =
      !require.authorities?.length ||
      require.authorities.some((a) => hasAuthority(user, a));

    return okRoles && okAuth;
  }, [require, user]);

  useEffect(() => {
    if (status === 'unknown') return;

    if (status === 'guest') {
      router.replace(`/login?next=${next}`);
      return;
    }

    if (!allowed && onDenied !== 'render-fallback') {
      if (onDenied === 'redirect-login') router.replace(`/login?next=${next}`);
      else router.replace('/');
    }
  }, [status, allowed, onDenied, router, next]);

  if (status === 'unknown') return <>{fallback}</>;
  if (status === 'guest') return <>{fallback}</>;
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
