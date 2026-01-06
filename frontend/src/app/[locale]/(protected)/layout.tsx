import { AuthGuard } from '@/features/auth/guard/ui/AuthGuard';
import { SessionGate } from '../../../features/session/ui/SessionGate';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>
    <SessionGate />
    {children}
  </AuthGuard>;
}
