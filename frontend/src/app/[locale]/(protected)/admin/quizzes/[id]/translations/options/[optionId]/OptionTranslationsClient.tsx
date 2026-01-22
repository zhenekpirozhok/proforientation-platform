'use client';

import { useMemo } from 'react';
import { AdminEntityTranslationsPage } from '@/features/admin-quiz-translations/ui/AdminEntityTranslationsPage';
import { OPTION_TRANSLATIONS_CONFIG } from '@/features/admin-quiz-translations/model/entityConfigs';
import { useGetQuizVersions } from '@/entities/quiz/api/useGetQuizVersions';
import type { QuizVersionDto } from '@/shared/api/generated/model';
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
  if (o.content !== undefined) return toArray<T>(o.content);
  if (o.data !== undefined) return toArray<T>(o.data);
  if (o.result !== undefined) return toArray<T>(o.result);
  if (o.payload !== undefined) return toArray<T>(o.payload);
  return [];
}

function safeString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

type OptionDto = { id?: number; label?: string };
type QuestionDto = { options?: OptionDto[] };

export default function OptionTranslationsClient(props: {
  quizId: number;
  optionId: number;
}) {
  const { quizId, optionId } = props;

  const versionsQ = useGetQuizVersions(quizId);
  const versions = (
    versionsQ as unknown as { data?: QuizVersionDto[] | undefined }
  )?.data;
  const latest = pickLatestQuizVersion(versions);
  const version = Number(
    (latest as Record<string, unknown> | undefined)?.version,
  );
  const versionNum = Number.isFinite(version) ? version : undefined;

  const questionsQ = useAdminQuestionsForQuizVersion(quizId, versionNum);
  const questions = toArray<QuestionDto>(
    (questionsQ as unknown as { data?: unknown })?.data,
  );

  const labelDefault = useMemo(() => {
    for (const q of questions) {
      const opts = toArray<OptionDto>(
        (q as Record<string, unknown> | undefined)?.options,
      );
      const found = opts.find(
        (o) =>
          Number((o as Record<string, unknown> | undefined)?.id) === optionId,
      );
      if (found)
        return safeString(
          (found as Record<string, unknown> | undefined)?.label,
        );
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
