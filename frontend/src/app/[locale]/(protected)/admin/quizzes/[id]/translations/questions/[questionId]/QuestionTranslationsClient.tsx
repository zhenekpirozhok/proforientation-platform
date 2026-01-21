'use client';

import { useMemo } from 'react';
import { AdminEntityTranslationsPage } from '@/features/admin-quiz-translations/ui/AdminEntityTranslationsPage';
import { QUESTION_TRANSLATIONS_CONFIG } from '@/features/admin-quiz-translations/model/entityConfigs';
import { useGetQuizVersions } from '@/entities/quiz/api/useGetQuizVersions';
import { pickLatestQuizVersion } from '@/shared/lib/quizVersion';
import { useAdminQuestionsForQuizVersion } from '@/entities/question/api/useAdminQuestionsForQuizVersion';

function toArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (!v || typeof v !== 'object') return [];
  const o = v as Record<string, unknown>;
  if (Array.isArray(o.items)) return o.items as T[];
  if (Array.isArray(o.results)) return o.results as T[];
  if (Array.isArray(o.rows)) return o.rows as T[];
  if (Array.isArray(o.content)) return o.content as T[];
  if (Array.isArray(o.content)) return o.content as T[];
  if (o.content !== undefined) return toArray<T>(o.content);
  if (o.data !== undefined) return toArray<T>(o.data);
  if (o.result !== undefined) return toArray<T>(o.result);
  if (o.payload !== undefined) return toArray<T>(o.payload);
  return [];
}

function safeString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

type QuestionDto = { id?: number; text?: string };

export default function QuestionTranslationsClient(props: { quizId: number; questionId: number }) {
  const { quizId, questionId } = props;

  const versionsQ = useGetQuizVersions(quizId);
  const versions = (versionsQ as any)?.data as any[] | undefined;
  const latest = pickLatestQuizVersion(versions as any);
  const version = Number((latest as any)?.version);
  const versionNum = Number.isFinite(version) ? version : undefined;

  const questionsQ = useAdminQuestionsForQuizVersion(quizId, versionNum);
  const questions = toArray<QuestionDto>((questionsQ as any)?.data);

  const textDefault = useMemo(() => {
    const found = questions.find((q) => Number((q as any)?.id) === questionId);
    return safeString((found as any)?.text);
  }, [questions, questionId]);

  return (
    <AdminEntityTranslationsPage
      entityId={questionId}
      config={QUESTION_TRANSLATIONS_CONFIG}
      backHref={`/admin/quizzes/${quizId}/translations`}
      titleKey="pageTitleQuestion"
      defaults={{ text: textDefault }}
    />
  );
}
