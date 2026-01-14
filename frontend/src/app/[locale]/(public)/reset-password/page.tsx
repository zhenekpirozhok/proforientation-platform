import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/features/auth/reset-password/ui/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Password Reset',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
