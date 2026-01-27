'use client';

import { useMemo } from 'react';
import { AdminEntityTranslationsPage } from '@/features/admin-quiz-translations/ui/AdminEntityTranslationsPage';
import { CATEGORY_TRANSLATIONS_CONFIG } from '@/features/admin-quiz-translations/model/entityConfigs';
import { useCategories } from '@/entities/category/api/useCategories';

function toNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

type CategoryDtoLike = { id?: number; name?: string };

export default function CategoryTranslationsClient(props: {
  quizId: number;
  categoryId: number;
}) {
  const { quizId, categoryId } = props;

  const categoriesQ = useCategories('en');
  const categories = (categoriesQ as { data?: CategoryDtoLike[] })?.data;

  const defaults = useMemo(() => {
    const found = (categories ?? []).find((x) => toNumber(x.id) === categoryId);
    return { title: safeString(found?.name) };
  }, [categories, categoryId]);

  return (
    <AdminEntityTranslationsPage
      entityId={categoryId}
      config={CATEGORY_TRANSLATIONS_CONFIG}
      backHref={`/admin/quizzes/${quizId}/translations`}
      titleKey="pageTitleCategory"
      defaults={defaults}
    />
  );
}
