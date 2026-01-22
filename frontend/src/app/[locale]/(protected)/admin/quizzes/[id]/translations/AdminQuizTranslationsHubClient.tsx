'use client';

import { useMemo } from 'react';

import { AdminQuizTranslationsHubPage } from '@/features/admin-quiz-translations/ui/AdminQuizTranslationsHubPage';
import type {
  QuizTranslatableRow,
  TranslationStatus,
} from '@/features/admin-quiz-translations/model/types';

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
  const o = v as Record<string, unknown> | undefined;
  if (Array.isArray(o?.items)) return o!.items as unknown as T[];
  if (Array.isArray(o?.results)) return o!.results as unknown as T[];
  if (Array.isArray(o?.rows)) return o!.rows as unknown as T[];
  if (Array.isArray(o?.content)) return o!.content as unknown as T[];
  if (o?.data !== undefined) return toArray<T>(o.data as unknown);
  if (o?.result !== undefined) return toArray<T>(o.result as unknown);
  if (o?.payload !== undefined) return toArray<T>(o.payload as unknown);
  return [];
}

const MISSING: TranslationStatus = 'missing';

export default function AdminQuizTranslationsHubClient({
  quizId,
}: {
  quizId: number;
}) {
  const canLoad = Number.isFinite(quizId) && quizId > 0;

  const quizQ = useAdminQuiz(canLoad ? quizId : 0, {
    query: { enabled: canLoad },
  });
  const versionsQ = useGetQuizVersions(canLoad ? quizId : 0);

  const latest = useMemo(
    () => pickLatestQuizVersion(versionsQ.data),
    [versionsQ.data],
  );
  const quizVersionId = safeNumber(
    (latest as unknown as Record<string, unknown>)?.id,
  );
  const version = safeNumber(
    (latest as unknown as Record<string, unknown>)?.version,
  );

  const questionsQ = useAdminQuestionsForQuizVersion(
    canLoad ? quizId : undefined,
    version ?? undefined,
    { page: '1', size: '200', sort: 'ord' },
  );

  const traitsQ = useQuizTraits(quizVersionId ?? undefined);

  const professionsQ = useSearchProfessions({ page: 1, size: 200, sort: 'id' });
  const categoriesQ = useCategories('en');

  const questions = useMemo(() => {
    const data = (questionsQ as unknown as Record<string, unknown>)?.data;
    const content =
      (data as unknown as Record<string, unknown>)?.content ??
      (data as unknown as Record<string, unknown>)?.items ??
      (data as unknown as Record<string, unknown>)?.results ??
      (data as unknown as Record<string, unknown>)?.rows ??
      (data as unknown as Record<string, unknown>)?.data ??
      data;
    return toArray<unknown>(content);
  }, [questionsQ]);

  const questionsRows = useMemo<QuizTranslatableRow[]>(() => {
    return questions
      .map((q: unknown) => {
        const id = safeNumber((q as Record<string, unknown>)?.id);
        if (!id) return null;

        const ord =
          safeNumber((q as Record<string, unknown>)?.ord) ?? undefined;
        const title = safeString((q as Record<string, unknown>)?.text);
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
      const qId = safeNumber((q as Record<string, unknown>)?.id);
      const qOrd = safeNumber((q as Record<string, unknown>)?.ord);
      const opts = toArray<unknown>(
        (q as Record<string, unknown>)?.options ?? [],
      );

      for (const o of opts) {
        const id = safeNumber((o as Record<string, unknown>)?.id);
        if (!id) continue;

        const oOrd = safeNumber((o as Record<string, unknown>)?.ord);
        const title = safeString((o as Record<string, unknown>)?.label);

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
    const traits = toArray<unknown>(
      (traitsQ as unknown as Record<string, unknown>)?.data,
    );
    return traits
      .map((tr) => {
        const t = tr as Record<string, unknown> | undefined;
        const id = safeNumber(t?.id);
        if (!id) return null;
        const title = safeString(t?.name ?? t?.title ?? t?.code);
        const subtitle = safeString(t?.code) || undefined;

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
    const data = (professionsQ as unknown as Record<string, unknown>)?.data;
    const content =
      (data as unknown as Record<string, unknown>)?.content ??
      (data as unknown as Record<string, unknown>)?.items ??
      (data as unknown as Record<string, unknown>)?.results ??
      (data as unknown as Record<string, unknown>)?.rows ??
      (data as unknown as Record<string, unknown>)?.data ??
      data;
    const professions = toArray<unknown>(content);

    return professions
      .map((p) => {
        const id = safeNumber((p as Record<string, unknown>)?.id);
        if (!id) return null;

        const title = safeString((p as Record<string, unknown>)?.title);
        const categoryId = safeNumber(
          (p as Record<string, unknown>)?.categoryId,
        );
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
    const categories = toArray<unknown>(
      (categoriesQ as unknown as Record<string, unknown>)?.data,
    );
    return categories
      .map((c) => {
        const cat = c as Record<string, unknown>;
        const id = safeNumber(cat.id);
        if (!id) return null;

        const title = safeString(cat.name ?? cat.title ?? cat.code);
        const subtitle = safeString(cat.code) || undefined;

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
    const q = (quizQ as unknown as Record<string, unknown>)?.data as
      | Record<string, unknown>
      | undefined;
    if (!q) return undefined;
    return {
      title: safeString(q?.titleDefault ?? q?.title),
      description: safeString(q?.descriptionDefault ?? q?.description),
    };
  }, [quizQ]);

  const isLoadingQuiz = Boolean(
    (quizQ as unknown as Record<string, unknown>)?.isLoading,
  );
  const isLoadingQuestions = Boolean(
    (questionsQ as unknown as Record<string, unknown>)?.isLoading,
  );
  const isLoadingOptions = isLoadingQuestions;
  const isLoadingTraits = Boolean(
    (traitsQ as unknown as Record<string, unknown>)?.isLoading,
  );
  const isLoadingProfessions = Boolean(
    (professionsQ as unknown as Record<string, unknown>)?.isLoading,
  );
  const isLoadingCategories = Boolean(
    (categoriesQ as unknown as Record<string, unknown>)?.isLoading,
  );

  return (
    <AdminQuizTranslationsHubPage
      quizId={quizId}
      quizDefaults={quizDefaults}
      questionsRows={questionsRows}
      optionsRows={optionsRows}
      traitsRows={traitsRows}
      professionsRows={professionsRows}
      categoriesRows={categoriesRows}
      isLoadingQuestions={!!isLoadingQuestions}
      isLoadingOptions={isLoadingOptions}
      isLoadingTraits={isLoadingTraits}
      isLoadingProfessions={isLoadingProfessions}
      isLoadingCategories={isLoadingCategories}
    />
  );
}
