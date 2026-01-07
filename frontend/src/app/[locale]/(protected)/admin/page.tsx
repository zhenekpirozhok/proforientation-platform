import { RoleGuard } from '@/features/auth/guard/ui/RoleGuard';

export default function AdminPage() {
  return (
    <RoleGuard require={{ roles: ['ADMIN'] }} onDenied="redirect-home">
      <div>Admin</div>
    </RoleGuard>
  );
}
