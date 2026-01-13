import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/forgot-password/ui/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot password',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
