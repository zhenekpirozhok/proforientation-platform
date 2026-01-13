import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/register/ui/RegisterForm';

export const metadata: Metadata = {
  title: 'Registration',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
