'use client';

import { useMemo } from 'react';
import { AdminQuizTranslationsHubPage } from '@/features/admin-quiz-translations/ui/AdminQuizTranslationsHubPage';
import type { QuizTranslatableRow, TranslationStatus } from '@/features/admin-quiz-translations/model/types';
import { useAdminQuiz } from '@/entities/quiz/api/useAdminQuiz';
import { useGetQuizVersions } from '@/entities/quiz/api/useGetQuizVersions';
import { pickLatestQuizVersion } from '@/shared/lib/quizVersion';
import { useAdminQuestionsForQuizVersion } from '@/entities/question/api/useAdminQuestionsForQuizVersion';
import { useSearchTranslations } from '@/entities/translation/api/useSearchTranslations';
import { useQuizTraits } from '@/entities/quiz/api/useQuizTraits';
import { useSearchProfessions } from '@/entities/profession/api/useSearchProfessions';
import { useCategories } from '@/entities/category/api/useCategories';

function toNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

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

type QuestionDto = { id?: number; ord?: number; text?: string; options?: Array<{ id?: number; ord?: number; label?: string }> };
type TraitDtoLike = { id?: number; name?: string; code?: string };
type ProfessionDtoLike = { id?: number; titleDefault?: string; categoryId?: number };
type CategoryDtoLike = { id?: number; name?: string };

const MISSING: TranslationStatus = 'missing';

export default function AdminQuizTranslationsHubClient({ quizId }: { quizId: number }) {
  const canLoad = Number.isFinite(quizId) && quizId > 0;

  const quizQ = useAdminQuiz(quizId);
  const quiz = (quizQ as any)?.data;

  const quizDefaults = useMemo(() => {
    const title = safeString(quiz?.titleDefault ?? quiz?.title_default ?? quiz?.title);
    const description = safeString(quiz?.descriptionDefault ?? quiz?.description_default ?? quiz?.description);
    return { title, description };
  }, [quiz]);

  const versionsQ = useGetQuizVersions(quizId);
  const versions = (versionsQ as any)?.data as any[] | undefined;
  const latest = pickLatestQuizVersion(versions as any);
  const quizVersionId = toNumber((latest as any)?.id);
  const version = toNumber((latest as any)?.version);

  const questionsQ = useAdminQuestionsForQuizVersion(quizId, version);
  const questions = useMemo(() => toArray<QuestionDto>((questionsQ as any)?.data), [questionsQ]);

  const questionsTrQ = useSearchTranslations(
    canLoad ? { entityType: 'question', entityId: quizId, locale: 'all' } : undefined,
  );
  const optionsTrQ = useSearchTranslations(
    canLoad ? { entityType: 'question_option', entityId: quizId, locale: 'all' } : undefined,
  );

  const questionsRows = useMemo<QuizTranslatableRow[]>(() => {
    return questions
      .map((q) => {
        const id = toNumber(q.id);
        if (!id) return null;
        return {
          id,
          title: safeString(q.text) || `#${id}`,
          subtitle: q.ord ? `#${q.ord}` : undefined,
          ru: MISSING,
          en: MISSING,
          href: `/admin/quizzes/${quizId}/translations/questions/${id}`,
        };
      })
      .filter(Boolean) as QuizTranslatableRow[];
  }, [questions, quizId]);

  const optionsRows = useMemo<QuizTranslatableRow[]>(() => {
    const out: QuizTranslatableRow[] = [];
    for (const q of questions) {
      const opts = toArray<{ id?: number; ord?: number; label?: string }>((q as any)?.options);
      for (const o of opts) {
        const id = toNumber(o.id);
        if (!id) continue;
        out.push({
          id,
          title: safeString(o.label) || `#${id}`,
          subtitle: q.ord && o.ord ? `Q#${q.ord} • Opt#${o.ord}` : undefined,
          ru: MISSING,
          en: MISSING,
          href: `/admin/quizzes/${quizId}/translations/options/${id}`,
        });
      }
    }
    return out;
  }, [questions, quizId]);

  const traitsQ = useQuizTraits(quizVersionId);
  const traits = useMemo(() => toArray<TraitDtoLike>((traitsQ as any)?.data), [traitsQ]);

  const traitsRows = useMemo<QuizTranslatableRow[]>(() => {
    return traits
      .map((tr) => {
        const id = toNumber(tr.id);
        if (!id) return null;
        return {
          id,
          title: safeString(tr.name) || safeString(tr.code) || `#${id}`,
          subtitle: safeString(tr.code) ? `#${safeString(tr.code)}` : undefined,
          ru: MISSING,
          en: MISSING,
          href: `/admin/quizzes/${quizId}/translations/traits/${id}`,
        };
      })
      .filter(Boolean) as QuizTranslatableRow[];
  }, [traits, quizId]);

  const professionsQ = useSearchProfessions({ page: 1, size: 200, sort: 'id' });

const professionsRows = useMemo<QuizTranslatableRow[]>(() => {
  const raw = (professionsQ as any)?.data;
  const items = toArray<Record<string, unknown>>(raw);

  return items
    .map((p) => {
      const id = toNumber(p.id);
      if (!id) return null;

      const title =
        safeString(p.title) ||
        safeString(p.titleDefault) ||
        safeString(p.title_default) ||
        safeString(p.name) ||
        safeString(p.code);

      const categoryId = toNumber(p.categoryId);
      const subtitle = categoryId ? `Category ${categoryId}` : undefined;

      return {
        id,
        title: title || '—',
        subtitle,
        ru: 'missing',
        en: 'missing',
        href: `/admin/quizzes/${quizId}/translations/professions/${id}`,
      };
    })
    .filter(Boolean) as QuizTranslatableRow[];
}, [professionsQ, quizId]);



  const categoriesQ = useCategories('en');
  const categories = (categoriesQ as any)?.data as CategoryDtoLike[] | undefined;

  const categoriesRows = useMemo<QuizTranslatableRow[]>(() => {
    return (categories ?? [])
      .map((c) => {
        const id = toNumber(c.id);
        if (!id) return null;
        return {
          id,
          title: safeString(c.name) || `#${id}`,
          subtitle: undefined,
          ru: MISSING,
          en: MISSING,
          href: `/admin/quizzes/${quizId}/translations/categories/${id}`,
        };
      })
      .filter(Boolean) as QuizTranslatableRow[];
  }, [categories, quizId]);

  const isLoadingQuiz = (quizQ as any)?.isLoading ?? false;
  const isLoadingVersions = (versionsQ as any)?.isLoading ?? false;
  const isLoadingQuestions = (questionsQ as any)?.isLoading ?? false;
  const isLoadingTraits = (traitsQ as any)?.isLoading ?? false;
  const isLoadingProfessions = (professionsQ as any)?.isLoading ?? false;
  const isLoadingCategories = (categoriesQ as any)?.isLoading ?? false;

  return (
    <AdminQuizTranslationsHubPage
      quizId={quizId}
      quizDefaults={quizDefaults}
      questionsRows={questionsRows}
      optionsRows={optionsRows}
      traitsRows={traitsRows}
      professionsRows={professionsRows}
      categoriesRows={categoriesRows}
      isLoadingQuestions={isLoadingQuiz || isLoadingVersions || isLoadingQuestions || ((questionsTrQ as any)?.isLoading ?? false)}
      isLoadingOptions={isLoadingQuiz || isLoadingVersions || isLoadingQuestions || ((optionsTrQ as any)?.isLoading ?? false)}
      isLoadingTraits={isLoadingQuiz || isLoadingVersions || isLoadingTraits}
      isLoadingProfessions={isLoadingQuiz || isLoadingProfessions}
      isLoadingCategories={isLoadingQuiz || isLoadingCategories}
    />
  );
}
