import type { Metadata } from 'next';
import ResultsPageClient from './ResultsPageClient';

export const metadata: Metadata = {
  title: 'Results',
};

export default function Page() {
  return <ResultsPageClient />;
}
