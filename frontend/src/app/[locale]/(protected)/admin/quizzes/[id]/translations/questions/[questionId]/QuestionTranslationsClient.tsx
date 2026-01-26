'use client';

import { useMemo } from 'react';
import { AdminEntityTranslationsPage } from '@/features/admin-quiz-translations/ui/AdminEntityTranslationsPage';
import { QUESTION_TRANSLATIONS_CONFIG } from '@/features/admin-quiz-translations/model/entityConfigs';
import { useGetQuizVersions } from '@/entities/quiz/api/useGetQuizVersions';
import { pickLatestQuizVersion } from '@/shared/lib/quizVersion';
import { useAdminQuestionsForQuizVersion } from '@/entities/question/api/useAdminQuestionsForQuizVersion';
import type { QuizVersionDto } from '@/shared/api/generated/model';

function toArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (!v || typeof v !== 'object') return [];
  const o = v as Record<string, unknown>;
  if (Array.isArray(o.items)) return o.items as T[];
  if (Array.isArray(o.results)) return o.results as T[];
  if (Array.isArray(o.rows)) return o.rows as T[];
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

function toNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

type QuestionDto = { id?: number; text?: string };

export default function QuestionTranslationsClient(props: {
  quizId: number;
  questionId: number;
}) {
  const { quizId, questionId } = props;

  const versionsQ = useGetQuizVersions(quizId);
  const versions = useMemo(
    () => toArray<QuizVersionDto>((versionsQ as { data?: unknown })?.data),
    [versionsQ],
  );

  const latest = useMemo(() => pickLatestQuizVersion(versions), [versions]);

  const versionNum = useMemo(() => {
    const raw = (latest as Record<string, unknown> | undefined)?.version;
    return toNumber(raw);
  }, [latest]);

  const questionsQ = useAdminQuestionsForQuizVersion(quizId, versionNum);
  const questions = useMemo(
    () => toArray<QuestionDto>((questionsQ as { data?: unknown })?.data),
    [questionsQ],
  );

  const textDefault = useMemo(() => {
    const found = questions.find(
      (q) => toNumber((q as Record<string, unknown> | undefined)?.id) === questionId,
    );
    return safeString((found as Record<string, unknown> | undefined)?.text);
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
