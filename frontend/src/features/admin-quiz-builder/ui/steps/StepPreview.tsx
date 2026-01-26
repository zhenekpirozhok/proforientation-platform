'use client';

import { JSX, useEffect, useMemo, useState } from 'react';
import { Button, Divider, Typography } from 'antd';
import { useTranslations } from 'next-intl';

import { SectionCard } from '../SectionCard';
import { useAdminQuizBuilderStore } from '../../model/store';
import { useQuizBuilderActions } from '@/features/admin-quiz-builder/api/useQuizBuilderActions';

import { useAdminCategories } from '@/entities/category/api/useAdminCategories';
import { useAdminProfessions } from '@/entities/profession/api/useAdminProfessions';
import { useSearchProfessions } from '@/entities/profession/api/useSearchProfessions';

import type { ProfessionCategoryDto as Category } from '@/shared/api/generated/model/professionCategoryDto';
import type { ProfessionDto as Profession } from '@/shared/api/generated/model/professionDto';

interface Init {
  title?: string;
  code?: string;
}

interface Scale {
  traitId?: number | string;
  name?: string;
  code?: string;
  tempId?: string | number;
  polarity?: 'bipolar' | string;
  side?: string;
}

interface RawOption {
  tempId?: string | number;
  ord?: number;
  label?: string;
  weightsByTraitId?: Record<string | number, number> | undefined;
}

interface RawQuestion {
  tempId?: string | number;
  ord?: number;
  qtype?: string;
  text?: string;
  options?: RawOption[];
}

interface QuestionOptionView {
  id?: string | number;
  ord?: number;
  label?: string;
  effect?: string;
}

interface QuestionView {
  id?: string | number;
  ord?: number;
  qtype?: string;
  text?: string;
  options: QuestionOptionView[];
}

interface SelectedView {
  id: number;
  label: string | number;
}

interface Results {
  selectedCategoryIds?: unknown;
  selectedProfessionIds?: unknown;
  [k: string]: unknown;
}

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

function safeIds(v: unknown): number[] {
  return Array.isArray(v)
    ? (v.filter((x) => typeof x === 'number' && Number.isFinite(x)) as number[])
    : [];
}

export function StepPreview(): JSX.Element {
  const t = useTranslations('AdminQuizBuilder.preview');

  const quizId: number | undefined = useAdminQuizBuilderStore((s) => s.quizId);
  const quizVersionId: number | undefined = useAdminQuizBuilderStore(
    (s) => s.quizVersionId,
  );
  const version: number | undefined = useAdminQuizBuilderStore(
    (s) => s.version,
  );

  const init: Init = useAdminQuizBuilderStore((s) => s.init);
  const scales: Scale[] | undefined = useAdminQuizBuilderStore((s) => s.scales);
  const questions: RawQuestion[] | undefined = useAdminQuizBuilderStore(
    (s) => s.questions,
  );
  const results: Results = useAdminQuizBuilderStore(
    (s) => s.results as Results,
  );

  const categoriesQuery = useAdminCategories();
  const professionsAllQuery = useAdminProfessions();

  const categoriesData: unknown =
    (categoriesQuery as unknown as { data?: unknown }).data ?? categoriesQuery;
  const professionsData: unknown =
    (professionsAllQuery as unknown as { data?: unknown }).data ??
    professionsAllQuery;

  const selectedCategoryIds = safeIds(results?.selectedCategoryIds);
  const selectedProfessionIds = safeIds(results?.selectedProfessionIds);

  const selectedCategoryId = toNumber(selectedCategoryIds[0]);

  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [allProfessions, setAllProfessions] = useState<Profession[]>([]);
  const [allLoaded, setAllLoaded] = useState(false);

  const searchRes = useSearchProfessions(
    typeof selectedCategoryId === 'number'
      ? { categoryId: selectedCategoryId, page, size, sort: 'id' }
      : undefined,
  );

  // Reset pagination and loaded state when category changes
  useEffect(() => {
    Promise.resolve().then(() => {
      setPage(1);
      setAllProfessions([]);
      setAllLoaded(false);
    });
  }, [selectedCategoryId]);

  // Update professions loaded for current category/page
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

  const categoryById = useMemo(() => {
    const arr = toArray<Category>(categoriesData) as Category[];
    const m = new Map<number, Category>();
    for (const c of arr) if (typeof c?.id === 'number') m.set(c.id, c);
    return m;
  }, [categoriesData]);

  const professionById = useMemo(() => {
    const arr = toArray<Profession>(professionsData) as Profession[];
    const m = new Map<number, Profession>();
    for (const p of arr) if (typeof p?.id === 'number') m.set(p.id, p);
    return m;
  }, [professionsData]);

  function safeLabelFromRec(r: unknown) {
    const rec = r as Record<string, unknown> | undefined;
    return (
      (rec?.title as string) ??
      (rec?.name as string) ??
      (rec?.code as string) ??
      rec?.id ??
      ''
    );
  }

  const selectedCategoriesView: SelectedView[] = useMemo(() => {
    return selectedCategoryIds.map((id) => {
      const c = categoryById.get(id) as Category | undefined;
      return {
        id,
        label: c ? safeLabelFromRec(c) : id,
      };
    });
  }, [selectedCategoryIds, categoryById]);

  const selectedProfessionsView: SelectedView[] = useMemo(() => {
    const resolved = selectedProfessionIds
      .map((id) => {
        const p = professionById.get(id) as Profession | undefined;
        if (!p) return null;
        return { id, label: safeLabelFromRec(p) } as SelectedView | null;
      })
      .filter(Boolean) as SelectedView[];

    return resolved;
  }, [selectedProfessionIds, professionById]);

  const scaleLabelByTraitId = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of scales ?? []) {
      const tid = toNumber(s.traitId);
      if (typeof tid !== 'number') continue;
      const name = s.name ?? s.code ?? s.tempId;
      const extra =
        s.polarity === 'bipolar' && s.side
          ? ` (${String(s.side).toLowerCase()})`
          : '';
      m.set(tid, `${name}${extra}`);
    }
    return m;
  }, [scales]);

  const questionsView: QuestionView[] = useMemo(() => {
    const qs = (questions ?? [])
      .slice()
      .sort((a: RawQuestion, b: RawQuestion) => (a.ord ?? 0) - (b.ord ?? 0));

    const effectText = (
      weightsByTraitId: Record<number, number> | undefined,
    ) => {
      const w = weightsByTraitId ?? {};
      const entries = Object.entries(w)
        .map(([k, v]) => [Number(k), v] as const)
        .filter(
          ([tid, val]) =>
            Number.isFinite(tid) && typeof val === 'number' && val !== 0,
        );

      if (entries.length === 0) return t('noEffect');

      return entries
        .map(([tid, val]) => {
          const label = scaleLabelByTraitId.get(tid) ?? `trait ${tid}`;
          const sign = val > 0 ? '+' : '';
          return `${label} ${sign}${val}`;
        })
        .join(', ');
    };

    return qs.map(
      (q: RawQuestion) =>
        ({
          id: q.tempId,
          ord: q.ord,
          qtype: q.qtype,
          text: q.text,
          options: (q.options ?? [])
            .slice()
            .sort((a: RawOption, b: RawOption) => (a.ord ?? 0) - (b.ord ?? 0))
            .map((o: RawOption) => ({
              id: o.tempId,
              ord: o.ord,
              label: o.label,
              effect: effectText(
                o.weightsByTraitId as Record<number, number> | undefined,
              ),
            })),
        }) as QuestionView,
    );
  }, [questions, scaleLabelByTraitId, t]);

  return (
    <SectionCard title={t('title')}>
      <div className="flex flex-col gap-3">
        <Typography.Title level={4} className="!m-0">
          {init.title}
        </Typography.Title>
        <Typography.Text type="secondary">{init.code}</Typography.Text>

        <Divider className="!my-3" />

        <Typography.Text className="font-medium">{t('scales')}</Typography.Text>
        <Typography.Text type="secondary">
          {scales.map((s) => s.name).join(', ') || t('none')}
        </Typography.Text>

        <Divider className="!my-3" />

        <Typography.Text className="font-medium">
          {t('questions')}
        </Typography.Text>
        {questionsView.length === 0 ? (
          <Typography.Text type="secondary">{t('none')}</Typography.Text>
        ) : (
          <div className="flex flex-col gap-3">
            {questionsView.map((q) => (
              <div
                key={q.id}
                className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <Typography.Text className="block font-medium">
                  {q.ord}. {q.text}
                </Typography.Text>
                <Typography.Text type="secondary" className="block">
                  {q.qtype}
                </Typography.Text>
                {q.options.length === 0 ? (
                  <Typography.Text type="secondary" className="block mt-2">
                    {t('none')}
                  </Typography.Text>
                ) : (
                  <ul className="mt-2 list-disc pl-6">
                    {q.options.map((o) => (
                      <li key={o.id}>
                        {o.label || t('none')} — {o.effect || t('noEffect')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <Divider className="!my-3" />

        <Typography.Text className="font-medium">
          {t('results')}
        </Typography.Text>

        <div className="mt-2 flex flex-col gap-2">
          <Typography.Text className="font-medium">
            {t('categories')}
          </Typography.Text>
          {selectedCategoriesView.length === 0 ? (
            <Typography.Text type="secondary">{t('none')}</Typography.Text>
          ) : (
            <ul className="list-disc pl-6">
              {selectedCategoriesView.map((c) => (
                <li key={c.id}>{c.label}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <Typography.Text className="font-medium">
            {t('professions')}
          </Typography.Text>

          {selectedProfessionsView.length > 0 ? (
            <ul className="list-disc pl-6">
              {selectedProfessionsView.map((p) => (
                <li key={p.id}>{p.label}</li>
              ))}
            </ul>
          ) : typeof selectedCategoryId === 'number' ? (
            allProfessions.length === 0 ? (
              <Typography.Text type="secondary">
                {searchRes.isFetching
                  ? t('loading')
                  : t('noProfessionsInCategory')}
              </Typography.Text>
            ) : (
              <div>
                <ul className="mt-2 list-disc pl-6">
                  {allProfessions.map((p: Profession) => (
                    <li key={p.id}>{safeLabelFromRec(p)}</li>
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
            )
          ) : (
            <Typography.Text type="secondary">
              {t('chooseCategoryToSeeProfessions')}
            </Typography.Text>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
