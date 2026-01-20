import { ForgotPasswordForm } from '@/features/auth/forgot-password/ui/ForgotPasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot password',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
