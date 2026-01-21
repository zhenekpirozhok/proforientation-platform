'use client';

import { useMemo } from 'react';
import { AdminQuizTranslationsHubPage } from '@/features/admin-quiz-translations/ui/AdminQuizTranslationsHubPage';
import { useSearchTranslations } from '@/entities/translation/api/useSearchTranslations';
import type { QuizTranslatableRow, TranslationStatus } from '@/features/admin-quiz-translations/model/types';
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

function buildStatusForEntity(entityId: number, items: TranslationDto[], requiredFields: string[]): { ru: TranslationStatus; en: TranslationStatus } {
  const byLocale = new Map<string, TranslationDto[]>();
  for (const it of items) {
    const loc = safeString(it.locale);
    if (!loc) continue;
    byLocale.set(loc, [...(byLocale.get(loc) ?? []), it]);
  }

  function localeStatus(locale: 'ru' | 'en'): TranslationStatus {
    const arr = byLocale.get(locale) ?? [];
    const fieldsWithText = new Set(
      arr
        .filter((x) => toNumber((x as any).entityId) === entityId || true)
        .filter((x) => requiredFields.includes(safeString(x.field)))
        .filter((x) => safeString(x.text).trim().length > 0)
        .map((x) => safeString(x.field)),
    );

    if (fieldsWithText.size === 0) return 'missing';
    if (fieldsWithText.size < requiredFields.length) return 'partial';
    return 'ok';
  }

  return { ru: localeStatus('ru'), en: localeStatus('en') };
}

type QuestionDto = {
  id?: number;
  ord?: number;
  text?: string;
  options?: Array<{ id?: number; ord?: number; label?: string }>;
};

export default function AdminQuizTranslationsHubClient({ quizId }: { quizId: number }) {
  const canLoad = Number.isFinite(quizId) && quizId > 0;

  const versionsQ = useGetQuizVersions(quizId);
  const versions = (versionsQ as any)?.data as any[] | undefined;
  const latest = pickLatestQuizVersion(versions as any);
  const version = toNumber((latest as any)?.version);
  const questionsQ = useAdminQuestionsForQuizVersion(quizId, version);

  const questions = useMemo(() => toArray<QuestionDto>((questionsQ as any)?.data), [questionsQ]);

  const questionsTrQ = useSearchTranslations(
    canLoad ? { entityType: 'question', entityId: quizId, locale: 'all' } : undefined,
  );
  const optionsTrQ = useSearchTranslations(
    canLoad ? { entityType: 'question_option', entityId: quizId, locale: 'all' } : undefined,
  );

  const questionsTranslations = useMemo(
    () => toArray<TranslationDto>((questionsTrQ as any)?.data),
    [questionsTrQ],
  );
  const optionsTranslations = useMemo(
    () => toArray<TranslationDto>((optionsTrQ as any)?.data),
    [optionsTrQ],
  );

  const questionsRows = useMemo<QuizTranslatableRow[]>(() => {
    return questions
      .map((q) => {
        const id = toNumber(q.id);
        if (!id) return null;

        const requiredFields = ['text'];
        const st = buildStatusForEntity(id, questionsTranslations, requiredFields);

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
      const opts = toArray<{ id?: number; ord?: number; label?: string }>((q as any)?.options);
      for (const o of opts) {
        const id = toNumber(o.id);
        if (!id) continue;

        const requiredFields = ['text'];
        const st = buildStatusForEntity(id, optionsTranslations, requiredFields);

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

  const isLoadingQuizVersions = (versionsQ as any)?.isLoading ?? false;
  const isLoadingQuestions = (questionsQ as any)?.isLoading ?? false;
  const isLoadingQuestionsTr = (questionsTrQ as any)?.isLoading ?? false;
  const isLoadingOptionsTr = (optionsTrQ as any)?.isLoading ?? false;

  return (
    <AdminQuizTranslationsHubPage
      quizId={quizId}
      questionsRows={questionsRows}
      optionsRows={optionsRows}
      isLoadingQuestions={isLoadingQuizVersions || isLoadingQuestions || isLoadingQuestionsTr}
      isLoadingOptions={isLoadingQuizVersions || isLoadingQuestions || isLoadingOptionsTr}
    />
  );
}
