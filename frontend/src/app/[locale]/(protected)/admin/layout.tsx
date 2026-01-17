import type { ReactNode } from 'react';
import { RoleGuard } from '@/features/auth/guard/ui/RoleGuard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard require={{ roles: ['ADMIN'] }} onDenied="redirect-home">
      {children}
    </RoleGuard>
  );
}
