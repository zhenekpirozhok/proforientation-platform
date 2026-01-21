'use client';

import { useMemo } from 'react';
import { AdminEntityTranslationsPage } from '@/features/admin-quiz-translations/ui/AdminEntityTranslationsPage';
import { TRAIT_TRANSLATIONS_CONFIG } from '@/features/admin-quiz-translations/model/entityConfigs';
import { useGetQuizVersions } from '@/entities/quiz/api/useGetQuizVersions';
import { pickLatestQuizVersion } from '@/shared/lib/quizVersion';
import { useQuizTraits } from '@/entities/quiz/api/useQuizTraits';

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

type TraitDtoLike = { id?: number; name?: string; description?: string };

export default function TraitTranslationsClient(props: { quizId: number; traitId: number }) {
  const { quizId, traitId } = props;

  const versionsQ = useGetQuizVersions(quizId);
  const versions = (versionsQ as any)?.data as any[] | undefined;
  const latest = pickLatestQuizVersion(versions as any);
  const quizVersionId = toNumber((latest as any)?.id);

  const traitsQ = useQuizTraits(quizVersionId);
  const traits = useMemo(() => toArray<TraitDtoLike>((traitsQ as any)?.data), [traitsQ]);

  const defaults = useMemo(() => {
    const found = traits.find((x) => toNumber((x as any)?.id) === traitId);
    return {
      title: safeString((found as any)?.name),
      description: safeString((found as any)?.description),
    };
  }, [traits, traitId]);

  return (
    <AdminEntityTranslationsPage
      entityId={traitId}
      config={TRAIT_TRANSLATIONS_CONFIG}
      backHref={`/admin/quizzes/${quizId}/translations`}
      titleKey="pageTitleTrait"
      defaults={defaults}
    />
  );
}
