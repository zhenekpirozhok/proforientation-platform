'use client';

import { Button, ColorPicker, Input, Select, Typography, message } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { SectionCard } from '../SectionCard';
import { FieldError } from '../FieldError';
import { useAdminQuizBuilderStore } from '../../model/store';

import { useAdminCategories } from '@/entities/category/api/useAdminCategories';
import { useQuizBuilderActions } from '@/features/admin-quiz-builder/api/useQuizBuilderActions';

import type { ProfessionCategoryDto as Category } from '@/shared/api/generated/model/professionCategoryDto';
import type { ProfessionDto as Profession } from '@/shared/api/generated/model/professionDto';

import { generateEntityCode } from '@/shared/lib/code/generateEntityCode';

import { useStepValidation } from '../../lib/validation/useStepValidation';
import { StepValidationSummary } from '../../lib/validation/StepValidationSummary';

function toNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (!v || typeof v !== 'object') return [];
  const o = v as Record<string, unknown>;

  if (Array.isArray(o.items as unknown)) return o.items as T[];
  if (Array.isArray(o.results as unknown)) return o.results as T[];
  if (Array.isArray(o.rows as unknown)) return o.rows as T[];
  if (Array.isArray(o.content as unknown)) return o.content as T[];

  if ((o.data as unknown) !== undefined) return toArray<T>(o.data as unknown);
  if ((o.result as unknown) !== undefined)
    return toArray<T>(o.result as unknown);
  if ((o.payload as unknown) !== undefined)
    return toArray<T>(o.payload as unknown);

  return [];
}

function colorToHex(c: string | Color | null | undefined): string | undefined {
  if (!c) return undefined;
  if (typeof c === 'string') return /^#[0-9A-Fa-f]{6}$/.test(c) ? c : undefined;
  try {
    const maybe = (c as { toHexString?: unknown }).toHexString;
    if (typeof maybe === 'function') {
      const hex = (maybe as () => string).call(c as object);
      return typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex)
        ? hex
        : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function safeLabelFromRec(r: unknown) {
  const rec = r as Record<string, unknown> | undefined;
  return (
    (rec?.title as string) ??
    (rec?.name as string) ??
    (rec?.code as string) ??
    (rec?.id as unknown) ??
    ''
  );
}

export function StepResults({
  errors,
  submitAttempted,
}: {
  errors: Record<string, string>;
  submitAttempted?: boolean;
}) {
  const t = useTranslations('AdminQuizBuilder.results');

  const v = useStepValidation({ errors, submitAttempted });

  const quizId = useAdminQuizBuilderStore((s) => s.quizId);
  const version = useAdminQuizBuilderStore((s) => s.version);
  const results = useAdminQuizBuilderStore((s) => s.results);
  const patchResults = useAdminQuizBuilderStore((s) => s.patchResults);

  const categories = useAdminCategories();
  const categoriesData: unknown =
    (categories as unknown as { data?: unknown }).data ?? categories;
  const isCategoriesLoading =
    (categories as unknown as { isLoading?: boolean }).isLoading ?? false;

  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [allProfessions, setAllProfessions] = useState<Profession[]>([]);
  const [allLoaded, setAllLoaded] = useState(false);

  const selectedCategoryId = toNumber(
    Array.isArray(results.selectedCategoryIds)
      ? results.selectedCategoryIds[0]
      : undefined,
  );

  const actions = useQuizBuilderActions(
    (quizId as number) ?? 0,
    0,
    typeof version === 'number' ? version : undefined,
  );
  const searchRes = actions.searchProfessionsHook({
    categoryId: selectedCategoryId,
    page,
    size,
  });

  const { createCategory, createProfession } = actions;

  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateProfession, setShowCreateProfession] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<
    Color | string | null
  >(null);

  const [newProfessionTitle, setNewProfessionTitle] = useState('');
  const [newProfessionDescription, setNewProfessionDescription] = useState('');

  const categoryOptions = useMemo(() => {
    const arr = toArray<Category>(categoriesData) as Category[];
    return arr.map((c) => ({
      value: c.id,
      label:
        (c as unknown as Record<string, unknown>)?.title ??
        (c as unknown as Record<string, unknown>)?.name ??
        (c as unknown as Record<string, unknown>)?.code ??
        c.id,
    }));
  }, [categoriesData]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setPage(1);
      setAllProfessions([]);
      setAllLoaded(false);
    });
  }, [selectedCategoryId]);

  useEffect(() => {
    const items = toArray<Profession>(searchRes.data ?? []) as Profession[];

    Promise.resolve().then(() => {
      setAllProfessions((prev) => {
        if (page === 1) return items;
        const ids = new Set(prev.map((p) => p.id));
        const next = [...prev];
        for (const it of items) {
          if (!ids.has(it.id)) next.push(it);
        }
        return next;
      });

      setAllLoaded(items.length < size);
    });
  }, [searchRes.data, page, size]);

  // whether saving is possible (derived where needed)

  async function onCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      message.error(t('validation.fixErrors'));
      return;
    }

    const colorCode = colorToHex(newCategoryColor);
    if (newCategoryColor && !colorCode) {
      message.error(t('invalidColor'));
      return;
    }

    try {
      const code = generateEntityCode(name, { fallback: 'category' });

      const res: unknown = await createCategory.mutateAsync({
        data: { name, code, colorCode },
      });

      const r = res as Record<string, unknown>;
      const createdId = toNumber(
        r?.id ??
          (r.data as Record<string, unknown>)?.id ??
          (r.result as Record<string, unknown>)?.id,
      );
      if (typeof createdId === 'number') {
        patchResults({ selectedCategoryIds: [createdId] });
        setShowCreateCategory(false);
      }

      setNewCategoryName('');
      setNewCategoryColor(null);
      message.success(t('categoryCreated'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  async function onCreateProfession() {
    const title = newProfessionTitle.trim();
    const description = newProfessionDescription.trim();

    if (!title || typeof selectedCategoryId !== 'number') {
      message.error(t('validation.fixErrors'));
      return;
    }

    try {
      const code = generateEntityCode(title, { fallback: 'profession' });

      const res: unknown = await createProfession.mutateAsync({
        data: {
          title,
          code,
          description: description || undefined,
          categoryId: selectedCategoryId,
        },
      });

      const r = res as Record<string, unknown>;
      const created =
        (r.data as Record<string, unknown>) ??
        (r.result as Record<string, unknown>) ??
        r;
      const createdId = toNumber((created as Record<string, unknown>)?.id);
      const createdCatId = toNumber(
        (created as Record<string, unknown>)?.categoryId,
      );

      if (
        created &&
        typeof createdId === 'number' &&
        createdCatId === selectedCategoryId
      ) {
        setAllProfessions((prev) => {
          if (prev.some((p) => toNumber(p.id) === createdId)) return prev;
          return [created as Profession, ...prev];
        });
      } else {
        setPage(1);
      }

      setNewProfessionTitle('');
      setNewProfessionDescription('');
      setShowCreateProfession(false);
      message.success(t('professionCreated'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  const isCategoryBusy = isCategoriesLoading || createCategory.isPending;
  const isProfessionBusy = searchRes.isFetching || createProfession.isPending;

  const summaryItems = useMemo(() => {
    const items: Array<{ field: string; label: string }> = [];
    if (v.showError('categories'))
      items.push({ field: 'categories', label: t('categories') });
    if (v.showError('categoryId'))
      items.push({ field: 'categoryId', label: t('categories') });
    return items;
  }, [v, t]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SectionCard title={t('title')}>
        <div className="flex flex-col gap-4">
          <StepValidationSummary
            title={t('validation.fixErrors')}
            items={summaryItems}
          />

          <div className="flex flex-col gap-2" data-field="categories">
            <Typography.Text className="block">
              {t('categories')}
            </Typography.Text>
            <Select
              value={
                typeof selectedCategoryId === 'number'
                  ? selectedCategoryId
                  : undefined
              }
              status={
                v.fieldStatus('categories') || v.fieldStatus('categoryId')
              }
              onBlur={() => v.markTouched('categories')}
              onChange={(id) =>
                patchResults({
                  selectedCategoryIds:
                    typeof id === 'undefined' ? [] : [toNumber(id) as number],
                })
              }
              options={categoryOptions}
              className="w-full"
              placeholder={t('categoriesPh')}
              allowClear
              loading={isCategoriesLoading}
              disabled={isCategoryBusy}
            />
            {v.showError('categories') ? (
              <FieldError code={errors.categories} />
            ) : null}
            {v.showError('categoryId') ? (
              <FieldError code={errors.categoryId} />
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setShowCreateCategory((vv) => !vv)}
                disabled={isCategoryBusy}
              >
                {showCreateCategory ? t('close') : t('addCategory')}
              </Button>
            </div>

            {showCreateCategory ? (
              <div className="mt-2 flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('newCategoryNamePh')}
                  disabled={isCategoryBusy}
                />
                <div className="flex items-center justify-between gap-3">
                  <Typography.Text>{t('newCategoryColorPh')}</Typography.Text>
                  <ColorPicker
                    value={
                      typeof newCategoryColor === 'string'
                        ? newCategoryColor
                        : null
                    }
                    onChange={(c) => setNewCategoryColor(c)}
                    disabled={isCategoryBusy}
                  />
                </div>
                <Button
                  type="primary"
                  onClick={onCreateCategory}
                  loading={createCategory.isPending}
                  disabled={isCategoryBusy}
                >
                  {t('add')}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Typography.Text className="block">
                {t('professions')}
              </Typography.Text>
              <Button
                onClick={() => setShowCreateProfession((vv) => !vv)}
                disabled={
                  typeof selectedCategoryId !== 'number' || isProfessionBusy
                }
              >
                {showCreateProfession ? t('close') : t('addProfession')}
              </Button>
            </div>

            {typeof selectedCategoryId !== 'number' ? (
              <Typography.Text type="secondary">
                {t('chooseCategoryToSeeProfessions')}
              </Typography.Text>
            ) : allProfessions.length === 0 ? (
              <Typography.Text type="secondary">
                {searchRes.isFetching
                  ? t('loading')
                  : t('noProfessionsInCategory')}
              </Typography.Text>
            ) : (
              <div>
                <ul className="mt-2 list-disc pl-6">
                  {allProfessions.map((p: Profession) => (
                    <li key={p.id}>{String(safeLabelFromRec(p) ?? p.id)}</li>
                  ))}
                </ul>

                {!allLoaded ? (
                  <div className="mt-2">
                    <Button
                      onClick={() => setPage((s) => s + 1)}
                      loading={searchRes.isFetching}
                    >
                      {t('loadMore')}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}

            {showCreateProfession ? (
              <div className="mt-2 flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
                <Input
                  value={newProfessionTitle}
                  onChange={(e) => setNewProfessionTitle(e.target.value)}
                  placeholder={t('newProfessionTitlePh')}
                  disabled={
                    typeof selectedCategoryId !== 'number' || isProfessionBusy
                  }
                />
                <Input.TextArea
                  value={newProfessionDescription}
                  onChange={(e) => setNewProfessionDescription(e.target.value)}
                  placeholder={t('newProfessionDescriptionPh')}
                  disabled={
                    typeof selectedCategoryId !== 'number' || isProfessionBusy
                  }
                  autoSize={{ minRows: 2, maxRows: 6 }}
                />
                <Button
                  type="primary"
                  onClick={onCreateProfession}
                  loading={createProfession.isPending}
                  disabled={
                    typeof selectedCategoryId !== 'number' || isProfessionBusy
                  }
                >
                  {t('add')}
                </Button>
              </div>
            ) : null}
          </div>

          <Typography.Text type="secondary" className="mt-1 block">
            {t('note')}
          </Typography.Text>
        </div>
      </SectionCard>
    </div>
  );
}
