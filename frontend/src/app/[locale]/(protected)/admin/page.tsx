import type { Metadata } from 'next';
import { RoleGuard } from '@/features/auth/guard/ui/RoleGuard';

export const metadata: Metadata = {
  title: 'Admin',
};

export default function AdminPage() {
  return (
    <RoleGuard require={{ roles: ['ADMIN'] }} onDenied="redirect-home">
      <div>Admin</div>
    </RoleGuard>
  );
}
