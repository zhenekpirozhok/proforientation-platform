'use client';

import { useMemo } from 'react';
import { AdminEntityTranslationsPage } from '@/features/admin-quiz-translations/ui/AdminEntityTranslationsPage';
import { OPTION_TRANSLATIONS_CONFIG } from '@/features/admin-quiz-translations/model/entityConfigs';
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
  if (o.data !== undefined) return toArray<T>(o.data);
  if (o.result !== undefined) return toArray<T>(o.result);
  if (o.payload !== undefined) return toArray<T>(o.payload);
  return [];
}

function safeString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

type QuestionOptionDto = { id?: number; labelDefault?: string; label_default?: string };

type QuestionDto = {
  options?: QuestionOptionDto[];
  questionOptions?: QuestionOptionDto[];
  question_options?: QuestionOptionDto[];
};

export default function OptionTranslationsClient(props: { quizId: number; optionId: number }) {
  const { quizId, optionId } = props;

  const versionsQ = useGetQuizVersions(quizId);
  const versions = (versionsQ as any)?.data as any[] | undefined;
  const latest = pickLatestQuizVersion(versions as any);
  const version = Number((latest as any)?.version);
  const versionNum = Number.isFinite(version) ? version : undefined;

  const questionsQ = useAdminQuestionsForQuizVersion(quizId, versionNum);
  const questions = toArray<QuestionDto>((questionsQ as any)?.data);

  const labelDefault = useMemo(() => {
    for (const q of questions) {
      const opts = (q as any)?.options ?? (q as any)?.questionOptions ?? (q as any)?.question_options ?? [];
      const arr = toArray<QuestionOptionDto>(opts);
      const found = arr.find((o) => Number((o as any)?.id) === optionId);
      if (found) return safeString((found as any)?.labelDefault ?? (found as any)?.label_default);
    }
    return '';
  }, [questions, optionId]);

  return (
    <AdminEntityTranslationsPage
      entityId={optionId}
      config={OPTION_TRANSLATIONS_CONFIG}
      backHref={`/admin/quizzes/${quizId}/translations`}
      titleKey="pageTitleOption"
      defaults={{ text: labelDefault }}
    />
  );
}
