import type { Metadata } from 'next';
import QuizzesPageClient from './QuizzesPageClient';

export const metadata: Metadata = {
  title: 'Quizzes',
};

export default function Page() {
  return <QuizzesPageClient />;
}