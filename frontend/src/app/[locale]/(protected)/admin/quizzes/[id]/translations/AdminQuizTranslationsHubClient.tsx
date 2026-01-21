'use client';

import { useMemo } from 'react';
import { AdminQuizTranslationsHubPage } from '@/features/admin-quiz-translations/ui/AdminQuizTranslationsHubPage';
import type { QuizTranslatableRow } from '@/features/admin-quiz-translations/model/types';
import { useGetQuizVersions } from '@/entities/quiz/api/useGetQuizVersions';
import { pickLatestQuizVersion } from '@/shared/lib/quizVersion';
import { useAdminQuestionsForQuizVersion } from '@/entities/question/api/useAdminQuestionsForQuizVersion';
import { useAdminQuiz } from '@/entities/quiz/api/useAdminQuiz';

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

type QuestionOptionDto = {
  id?: number;
  ord?: number;
  labelDefault?: string;
  label_default?: string;
};

type QuestionDto = {
  id?: number;
  ord?: number;
  textDefault?: string;
  text_default?: string;
  options?: QuestionOptionDto[];
  questionOptions?: QuestionOptionDto[];
  question_options?: QuestionOptionDto[];
};

export default function AdminQuizTranslationsHubClient({ quizId }: { quizId: number }) {
  const enabled = Number.isFinite(quizId) && quizId > 0;

  const quizQ = useAdminQuiz(quizId, { query: { enabled } } as any);
  const quizData = (quizQ as any)?.data;
  const quiz = (quizData as any)?.data ?? (quizData as any)?.result ?? quizData;

const quizDefaults = useMemo(() => {
  const title =
    safeString((quiz as any)?.titleDefault) ||
    safeString((quiz as any)?.title_default) ||
    safeString((quiz as any)?.title);

  const description =
    safeString((quiz as any)?.descriptionDefault) ||
    safeString((quiz as any)?.description_default) ||
    safeString((quiz as any)?.description);

  return { title, description };
}, [quiz]);

  const versionsQ = useGetQuizVersions(enabled ? quizId : 0);
  const versions = (versionsQ as any)?.data as any[] | undefined;
  const latest = pickLatestQuizVersion(versions as any);
  const version = Number((latest as any)?.version);
  const versionNum = Number.isFinite(version) ? version : undefined;

  const questionsQ = useAdminQuestionsForQuizVersion(enabled ? quizId : undefined, versionNum);
  const questionsData = (questionsQ as any)?.data;
  const questions = toArray<QuestionDto>(questionsData);

  const questionsRows = useMemo<QuizTranslatableRow[]>(() => {
    return questions
      .map((q) => {
        const id = Number((q as any)?.id);
        if (!Number.isFinite(id)) return null;

        const title = safeString((q as any)?.textDefault ?? (q as any)?.text_default) || `#${id}`;
        const ord = Number((q as any)?.ord);
        const subtitle = Number.isFinite(ord) ? `#${ord}` : undefined;

        return {
          id,
          title,
          subtitle,
          href: `/admin/quizzes/${quizId}/translations/questions/${id}`,
        };
      })
      .filter(Boolean) as QuizTranslatableRow[];
  }, [questions, quizId]);

  const optionsRows = useMemo<QuizTranslatableRow[]>(() => {
    const out: QuizTranslatableRow[] = [];
    for (const q of questions) {
      const qid = Number((q as any)?.id);
      const opts = (q as any)?.options ?? (q as any)?.questionOptions ?? (q as any)?.question_options ?? [];
      const arr = toArray<QuestionOptionDto>(opts);

      for (const o of arr) {
        const id = Number((o as any)?.id);
        if (!Number.isFinite(id)) continue;

        const title = safeString((o as any)?.labelDefault ?? (o as any)?.label_default) || `#${id}`;
        const ord = Number((o as any)?.ord);
        const subtitleParts: string[] = [];
        if (Number.isFinite(qid)) subtitleParts.push(`Q#${qid}`);
        if (Number.isFinite(ord)) subtitleParts.push(`opt#${ord}`);

        out.push({
          id,
          title,
          subtitle: subtitleParts.length ? subtitleParts.join(' · ') : undefined,
          href: `/admin/quizzes/${quizId}/translations/options/${id}`,
        });
      }
    }
    return out;
  }, [questions, quizId]);

  const isLoadingQuestions = !!(questionsQ as any)?.isLoading || !!(versionsQ as any)?.isLoading;
  const isLoadingOptions = isLoadingQuestions;

  return (
    <AdminQuizTranslationsHubPage
      quizId={quizId}
      quizDefaults={quizDefaults}
      questionsRows={questionsRows}
      optionsRows={optionsRows}
      isLoadingQuestions={isLoadingQuestions}
      isLoadingOptions={isLoadingOptions}
    />
  );
}
