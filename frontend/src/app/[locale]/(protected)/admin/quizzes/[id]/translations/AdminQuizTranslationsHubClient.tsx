'use client';

import { useMemo } from 'react';

import { AdminQuizTranslationsHubPage } from '@/features/admin-quiz-translations/ui/AdminQuizTranslationsHubPage';
import type { QuizTranslatableRow, TranslationStatus } from '@/features/admin-quiz-translations/model/types';

import { useAdminQuiz } from '@/entities/quiz/api/useAdminQuiz';
import { useGetQuizVersions } from '@/entities/quiz/api/useGetQuizVersions';
import { pickLatestQuizVersion } from '@/shared/lib/quizVersion';

import { useAdminQuestionsForQuizVersion } from '@/entities/question/api/useAdminQuestionsForQuizVersion';
import { useQuizTraits } from '@/entities/quiz/api/useQuizTraits';

import { useSearchProfessions } from '@/entities/profession/api/useSearchProfessions';
import { useCategories } from '@/entities/category/api/useCategories';

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function safeNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (!v || typeof v !== 'object') return [];
  const o = v as any;
  if (Array.isArray(o.items)) return o.items as T[];
  if (Array.isArray(o.results)) return o.results as T[];
  if (Array.isArray(o.rows)) return o.rows as T[];
  if (Array.isArray(o.content)) return o.content as T[];
  if (o.data !== undefined) return toArray<T>(o.data);
  if (o.result !== undefined) return toArray<T>(o.result);
  if (o.payload !== undefined) return toArray<T>(o.payload);
  return [];
}

const MISSING: TranslationStatus = 'missing';

export default function AdminQuizTranslationsHubClient({ quizId }: { quizId: number }) {
  const canLoad = Number.isFinite(quizId) && quizId > 0;

  const quizQ = useAdminQuiz(canLoad ? quizId : 0, { query: { enabled: canLoad } } as any);
  const versionsQ = useGetQuizVersions(canLoad ? quizId : 0);

  const latest = useMemo(() => pickLatestQuizVersion(versionsQ.data), [versionsQ.data]);
  const quizVersionId = safeNumber((latest as any)?.id);
  const version = safeNumber((latest as any)?.version);

  const questionsQ = useAdminQuestionsForQuizVersion(
    canLoad ? quizId : undefined,
    version ?? undefined,
    { page: '1', size: '200', sort: 'ord' },
  );

  const traitsQ = useQuizTraits(quizVersionId ?? undefined);

  const professionsQ = useSearchProfessions({ page: 1, size: 200, sort: 'id' });
  const categoriesQ = useCategories('en');

  const questions = useMemo(() => {
    const data = (questionsQ as any)?.data;
    const content = (data as any)?.content ?? (data as any)?.items ?? (data as any)?.results ?? (data as any)?.rows ?? (data as any)?.data ?? data;
    return toArray<any>(content);
  }, [questionsQ]);

  const questionsRows = useMemo<QuizTranslatableRow[]>(() => {
    return questions
      .map((q: any) => {
        const id = safeNumber(q?.id);
        if (!id) return null;

        const ord = safeNumber(q?.ord) ?? undefined;
        const title = safeString(q?.text);
        const subtitle = ord ? `#${ord}` : undefined;

        const row: QuizTranslatableRow = {
          id,
          title: title || `Question ${id}`,
          subtitle,
          ru: MISSING,
          en: MISSING,
          href: `/admin/quizzes/${quizId}/translations/questions/${id}`,
        };
        return row;
      })
      .filter(Boolean) as QuizTranslatableRow[];
  }, [questions, quizId]);

  const optionsRows = useMemo<QuizTranslatableRow[]>(() => {
    const out: QuizTranslatableRow[] = [];

    for (const q of questions) {
      const qId = safeNumber((q as any)?.id);
      const qOrd = safeNumber((q as any)?.ord);
      const opts = toArray<any>((q as any)?.options ?? []);

      for (const o of opts) {
        const id = safeNumber((o as any)?.id);
        if (!id) continue;

        const oOrd = safeNumber((o as any)?.ord);
        const title = safeString((o as any)?.label);

        const parts: string[] = [];
        if (qOrd) parts.push(`Q#${qOrd}`);
        if (oOrd) parts.push(`O#${oOrd}`);

        out.push({
          id,
          title: title || `Option ${id}`,
          subtitle: parts.length ? parts.join(' • ') : undefined,
          ru: MISSING,
          en: MISSING,
          href: `/admin/quizzes/${quizId}/translations/options/${id}`,
        });
      }
    }

    return out;
  }, [questions, quizId]);

  const traitsRows = useMemo<QuizTranslatableRow[]>(() => {
    const traits = toArray<any>((traitsQ as any)?.data);
    return traits
      .map((tr) => {
        const id = safeNumber(tr?.id);
        if (!id) return null;
        const title = safeString(tr?.name ?? tr?.title ?? tr?.code);
        const subtitle = safeString(tr?.code) || undefined;

        const row: QuizTranslatableRow = {
          id,
          title: title || `Trait ${id}`,
          subtitle,
          ru: MISSING,
          en: MISSING,
          href: `/admin/quizzes/${quizId}/translations/traits/${id}`,
        };
        return row;
      })
      .filter(Boolean) as QuizTranslatableRow[];
  }, [traitsQ, quizId]);

  const professionsRows = useMemo<QuizTranslatableRow[]>(() => {
    const data = (professionsQ as any)?.data;
    const content = (data as any)?.content ?? (data as any)?.items ?? (data as any)?.results ?? (data as any)?.rows ?? (data as any)?.data ?? data;
    const professions = toArray<any>(content);

    return professions
      .map((p) => {
        const id = safeNumber(p?.id);
        if (!id) return null;

        const title = safeString(p?.title);
        const categoryId = safeNumber(p?.categoryId);
        const subtitle = categoryId ? `Category ${categoryId}` : undefined;

        const row: QuizTranslatableRow = {
          id,
          title: title || `Profession ${id}`,
          subtitle,
          ru: MISSING,
          en: MISSING,
          href: `/admin/quizzes/${quizId}/translations/professions/${id}`,
        };
        return row;
      })
      .filter(Boolean) as QuizTranslatableRow[];
  }, [professionsQ, quizId]);

  const categoriesRows = useMemo<QuizTranslatableRow[]>(() => {
    const categories = toArray<any>((categoriesQ as any)?.data);
    return categories
      .map((c) => {
        const id = safeNumber(c?.id);
        if (!id) return null;

        const title = safeString(c?.name ?? c?.title ?? c?.code);
        const subtitle = safeString(c?.code) || undefined;

        const row: QuizTranslatableRow = {
          id,
          title: title || `Category ${id}`,
          subtitle,
          ru: MISSING,
          en: MISSING,
          href: `/admin/quizzes/${quizId}/translations/categories/${id}`,
        };
        return row;
      })
      .filter(Boolean) as QuizTranslatableRow[];
  }, [categoriesQ, quizId]);

  const quizDefaults = useMemo(() => {
    const q = (quizQ as any)?.data as any;
    if (!q) return undefined;
    return {
      title: safeString(q?.titleDefault ?? q?.title),
      description: safeString(q?.descriptionDefault ?? q?.description),
    };
  }, [quizQ]);

  const isLoadingQuiz = (quizQ as any)?.isLoading ?? false;
  const isLoadingQuestions = (questionsQ as any)?.isLoading ?? false;
  const isLoadingOptions = isLoadingQuestions;
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
      isLoadingQuestions={isLoadingQuestions}
      isLoadingOptions={isLoadingOptions}
      isLoadingTraits={isLoadingTraits}
      isLoadingProfessions={isLoadingProfessions}
      isLoadingCategories={isLoadingCategories}
    />
  );
}
