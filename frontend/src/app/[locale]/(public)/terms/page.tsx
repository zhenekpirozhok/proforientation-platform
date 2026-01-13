import type { Metadata } from 'next';
import TermsPageClient from './TermsPageClient';

export const metadata: Metadata = {
  title: 'Terms of Use',
};

export default function Page() {
  return <TermsPageClient />;
}
