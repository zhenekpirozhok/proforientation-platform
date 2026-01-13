'use client';

import { Button, Select, Typography, message } from 'antd';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { SectionCard } from '../SectionCard';
import { FieldError } from '../FieldError';
import { useAdminQuizBuilderStore } from '../../model/store';

import { useAdminCategories } from '@/entities/category/api/useAdminCategories';
import { useAdminProfessions } from '@/entities/profession/api/useAdminProfessions';
import { useAdminUpdateQuiz } from '@/entities/quiz/api/useAdminUpdateQuiz';

import type { ProfessionCategoryDto as Category } from '@/shared/api/generated/model/professionCategoryDto';
import type { ProfessionDto as Profession } from '@/shared/api/generated/model/professionDto';

function toNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
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

export function StepResults({ errors }: { errors: Record<string, string> }) {
  const t = useTranslations('AdminQuizBuilder.results');

  const quizId = useAdminQuizBuilderStore((s) => s.quizId);
  const results = useAdminQuizBuilderStore((s) => s.results);
  const patchResults = useAdminQuizBuilderStore((s) => s.patchResults);

  const categories = useAdminCategories();
  const professions = useAdminProfessions();

  const updateQuiz = useAdminUpdateQuiz();

  const categoryOptions = useMemo(() => {
    const arr = toArray<Category>((categories as any).data ?? categories);
    return arr.map((c: any) => ({
      value: c.id,
      label: c.title ?? c.name ?? c.code ?? c.id,
    }));
  }, [(categories as any).data, categories]);

  const professionsInCategory = useMemo(() => {
    const all = toArray<Profession>((professions as any).data ?? professions) as any[];
    const categoryId = toNumber(results.categoryId);
    if (typeof categoryId !== 'number') return [];
    return all.filter((p) => toNumber(p.categoryId) === categoryId);
  }, [(professions as any).data, professions, results.categoryId]);

  const canSave = typeof quizId === 'number' && typeof toNumber(results.categoryId) === 'number';

  async function onSave() {
    if (!canSave) {
      message.error(t('validation.fixErrors'));
      return;
    }
    try {
      await updateQuiz.mutateAsync({
        id: quizId as any,
        data: { categoryId: toNumber(results.categoryId) } as any,
      });
      message.success(t('saved'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SectionCard title={t('title')}>
        <div className="flex flex-col gap-3">
          <Typography.Text className="block">{t('categories')}</Typography.Text>
          <Select
            value={results.categoryId as any}
            onChange={(id) => patchResults({ categoryId: toNumber(id) })}
            options={categoryOptions}
            className="w-full"
            placeholder={t('categoriesPh')}
            allowClear
          />
          <FieldError code={errors.categoryId} />

          <Button type="primary" onClick={onSave} disabled={!canSave} loading={updateQuiz.isPending}>
            {t('save')}
          </Button>

          <div className="mt-2">
            <Typography.Text className="block">{t('professions')}</Typography.Text>

            {typeof toNumber(results.categoryId) !== 'number' ? (
              <Typography.Text type="secondary">{t('chooseCategoryToSeeProfessions')}</Typography.Text>
            ) : professionsInCategory.length === 0 ? (
              <Typography.Text type="secondary">{t('noProfessionsInCategory')}</Typography.Text>
            ) : (
              <ul className="mt-2 list-disc pl-6">
                {professionsInCategory.map((p: any) => (
                  <li key={p.id}>{p.title ?? p.name ?? p.code ?? p.id}</li>
                ))}
              </ul>
            )}
          </div>

          <Typography.Text type="secondary" className="mt-3 block">
            {t('note')}
          </Typography.Text>
        </div>
      </SectionCard>
    </div>
  );
}
