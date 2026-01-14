'use client';

import { useParams } from 'next/navigation';
import { AdminQuizBuilderPage } from '@/features/admin-quiz-builder/ui/AdminQuizBuilderPage';

export default function Page() {
  const params = useParams();
  const quizId = typeof params?.id === 'string' ? parseInt(params.id, 10) : undefined;

  return <AdminQuizBuilderPage quizId={quizId} />;
}
