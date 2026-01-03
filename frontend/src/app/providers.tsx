'use client';

import { AppProviders } from '@/shared/providers/AppProviders';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
