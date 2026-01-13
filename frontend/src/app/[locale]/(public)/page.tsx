import type { Metadata } from 'next';
import { LandingPage } from '@/features/landing/ui/LandingPage';

export const metadata: Metadata = {
  title: 'Home',
};

export default async function Page() {
  return <LandingPage />;
}
