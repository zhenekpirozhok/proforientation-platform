'use client';

import { useMemo } from 'react';
import { AdminQuizTranslationsHubPage } from '@/features/admin-quiz-translations/ui/AdminQuizTranslationsHubPage';
import { useSearchTranslations } from '@/entities/translation/api/useSearchTranslations';
import type { QuizTranslatableRow, TranslationStatus } from '@/features/admin-quiz-translations/model/types';
import { useGetQuizVersions } from '@/entities/quiz/api/useGetQuizVersions';
import type { QuizVersionDto } from '@/shared/api/generated/model';
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
  if (o.content !== undefined) return toArray<T>(o.content);
  if (o.data !== undefined) return toArray<T>(o.data);
  if (o.result !== undefined) return toArray<T>(o.result);
  if (o.payload !== undefined) return toArray<T>(o.payload);
  return [];
}

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function toNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

type TranslationDto = { field?: string; locale?: string; text?: string };

function statusFromTranslations(items: TranslationDto[], requiredFields: string[]) {
  const byLocale = new Map<string, Map<string, string>>();
  for (const it of items) {
    const loc = safeString(it.locale);
    const field = safeString(it.field);
    const text = safeString(it.text).trim();
    if (!loc || !field) continue;
    if (!byLocale.has(loc)) byLocale.set(loc, new Map());
    byLocale.get(loc)!.set(field, text);
  }

  function one(locale: 'ru' | 'en'): TranslationStatus {
    const m = byLocale.get(locale) ?? new Map();
    let filled = 0;
    for (const f of requiredFields) if ((m.get(f) ?? '').trim()) filled += 1;
    if (filled === 0) return 'missing';
    if (filled < requiredFields.length) return 'partial';
    return 'ok';
  }

  return { ru: one('ru'), en: one('en') };
}

type QuestionDto = {
  id?: number;
  ord?: number;
  text?: string;
  options?: Array<{ id?: number; ord?: number; label?: string }>;
};

export default function AdminQuizTranslationsHubClient({ quizId }: { quizId: number }) {
  const canLoad = Number.isFinite(quizId) && quizId > 0;

  const quizQ = useAdminQuiz(quizId);
  const quiz = (quizQ as unknown as { data?: unknown })?.data as Record<string, unknown> | undefined;

  const quizDefaults = useMemo(() => {
    const title = safeString((quiz as Record<string, unknown> | undefined)?.titleDefault) || safeString((quiz as Record<string, unknown> | undefined)?.title_default) || safeString((quiz as Record<string, unknown> | undefined)?.title);

    const description = safeString((quiz as Record<string, unknown> | undefined)?.descriptionDefault) || safeString((quiz as Record<string, unknown> | undefined)?.description_default) || safeString((quiz as Record<string, unknown> | undefined)?.description);

    return { title, description };
  }, [quiz]);

  const versionsQ = useGetQuizVersions(quizId);
  const versions = (versionsQ as unknown as { data?: QuizVersionDto[] | undefined })?.data;
  const latest = pickLatestQuizVersion(versions);
  const version = toNumber((latest as Record<string, unknown> | undefined)?.version);
  const questionsQ = useAdminQuestionsForQuizVersion(quizId, version);

  const questions = useMemo(() => toArray<QuestionDto>((questionsQ as unknown as { data?: unknown })?.data), [questionsQ]);

  const questionsTrQ = useSearchTranslations(canLoad ? { entityType: 'question', entityId: quizId, locale: 'all' } : undefined);
  const optionsTrQ = useSearchTranslations(canLoad ? { entityType: 'question_option', entityId: quizId, locale: 'all' } : undefined);

  const questionsTranslations = useMemo(() => toArray<TranslationDto>((questionsTrQ as unknown as { data?: unknown })?.data), [questionsTrQ]);
  const optionsTranslations = useMemo(() => toArray<TranslationDto>((optionsTrQ as unknown as { data?: unknown })?.data), [optionsTrQ]);

  const questionsRows = useMemo<QuizTranslatableRow[]>(() => {
    return questions
      .map((q) => {
        const id = toNumber(q.id);
        if (!id) return null;

        const st = statusFromTranslations(questionsTranslations, ['text']);

        return {
          id,
          title: safeString(q.text) || `#${id}`,
          subtitle: q.ord ? `#${q.ord}` : undefined,
          ru: st.ru,
          en: st.en,
          href: `/admin/quizzes/${quizId}/translations/questions/${id}`,
        };
      })
      .filter(Boolean) as QuizTranslatableRow[];
  }, [questions, questionsTranslations, quizId]);

  const optionsRows = useMemo<QuizTranslatableRow[]>(() => {
    const rows: QuizTranslatableRow[] = [];
    for (const q of questions) {
      const opts = toArray<{ id?: number; ord?: number; label?: string }>((q as Record<string, unknown> | undefined)?.options);
      for (const o of opts) {
        const id = toNumber(o.id);
        if (!id) continue;

        const st = statusFromTranslations(optionsTranslations, ['text']);

        rows.push({
          id,
          title: safeString(o.label) || `#${id}`,
          subtitle: q.ord && o.ord ? `Q#${q.ord} • Opt#${o.ord}` : undefined,
          ru: st.ru,
          en: st.en,
          href: `/admin/quizzes/${quizId}/translations/options/${id}`,
        });
      }
    }
    return rows;
  }, [questions, optionsTranslations, quizId]);

  const isLoadingQuiz = (quizQ as unknown as { isLoading?: boolean })?.isLoading ?? false;
  const isLoadingVersions = (versionsQ as unknown as { isLoading?: boolean })?.isLoading ?? false;
  const isLoadingQuestions = (questionsQ as unknown as { isLoading?: boolean })?.isLoading ?? false;
  const isLoadingQuestionsTr = (questionsTrQ as unknown as { isLoading?: boolean })?.isLoading ?? false;
  const isLoadingOptionsTr = (optionsTrQ as unknown as { isLoading?: boolean })?.isLoading ?? false;

  return (
    <AdminQuizTranslationsHubPage
      quizId={quizId}
      quizDefaults={quizDefaults}
      questionsRows={questionsRows}
      optionsRows={optionsRows}
      isLoadingQuestions={isLoadingQuiz || isLoadingVersions || isLoadingQuestions || isLoadingQuestionsTr}
      isLoadingOptions={isLoadingQuiz || isLoadingVersions || isLoadingQuestions || isLoadingOptionsTr}
    />
  );
}
