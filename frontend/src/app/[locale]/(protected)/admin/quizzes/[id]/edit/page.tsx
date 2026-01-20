'use client';

import { useParams } from 'next/navigation';
import { AdminQuizBuilderPage } from '@/features/admin-quiz-builder/ui/AdminQuizBuilderPage';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function Page() {
  const params = useParams();
  const rawId = (params as Record<string, unknown> | undefined)?.id;
  const quizId =
    typeof rawId === 'string'
      ? Number.parseInt(rawId, 10)
      : Array.isArray(rawId) && typeof rawId[0] === 'string'
        ? Number.parseInt(rawId[0], 10)
        : NaN;

  return (
    <AdminQuizBuilderPage
      quizId={Number.isFinite(quizId) ? quizId : undefined}
    />
  );
}
