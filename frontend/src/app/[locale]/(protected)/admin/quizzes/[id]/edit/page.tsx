'use client';

import { useParams } from 'next/navigation';
import { AdminQuizBuilderPage } from '@/features/admin-quiz-builder/ui/AdminQuizBuilderPage';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function Page() {
  const params = useParams();
  const raw = (params as any)?.id;
  const quizId = typeof raw === 'string' ? Number.parseInt(raw, 10) : Array.isArray(raw) ? Number.parseInt(raw[0], 10) : NaN;

  return <AdminQuizBuilderPage quizId={Number.isFinite(quizId) ? quizId : undefined} />;
}
