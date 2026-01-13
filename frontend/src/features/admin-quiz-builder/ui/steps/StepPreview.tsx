'use client';

import { Button, Divider, Typography, message } from 'antd';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { SectionCard } from '../SectionCard';
import { useAdminQuizBuilderStore } from '../../model/store';
import { useQuizBuilderActions } from '@/features/admin-quiz-builder/api/useQuizBuilderActions';

import { useAdminCategories } from '@/entities/category/api/useAdminCategories';
import { useAdminProfessions } from '@/entities/profession/api/useAdminProfessions';
import { useSearchProfessions } from '@/entities/profession/api/useSearchProfessions';

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

function safeIds(v: unknown): number[] {
  return Array.isArray(v) ? (v.filter((x) => typeof x === 'number' && Number.isFinite(x)) as number[]) : [];
}

export function StepPreview() {
  const t = useTranslations('AdminQuizBuilder.preview');

  const quizId = useAdminQuizBuilderStore((s) => s.quizId);
  const version = useAdminQuizBuilderStore((s) => s.version);

  const init = useAdminQuizBuilderStore((s) => s.init);
  const scales = useAdminQuizBuilderStore((s) => s.scales);
  const questions = useAdminQuizBuilderStore((s) => s.questions);
  const results = useAdminQuizBuilderStore((s) => s.results as any);

  const categoriesQuery = useAdminCategories();
  const professionsAllQuery = useAdminProfessions();

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

  useEffect(() => {
    setPage(1);
    setAllProfessions([]);
    setAllLoaded(false);
  }, [selectedCategoryId]);

  useEffect(() => {
    const items = toArray<Profession>(searchRes.data ?? []) as Profession[];

    setAllProfessions((prev) => {
      if (page === 1) return items;
      const ids = new Set(prev.map((p: any) => p.id));
      const next = [...prev];
      for (const it of items as any[]) {
        if (!ids.has(it.id)) next.push(it);
      }
      return next;
    });

    setAllLoaded(items.length < size);
  }, [searchRes.data, page, size]);

  const categoryById = useMemo(() => {
    const arr = toArray<Category>((categoriesQuery as any).data ?? categoriesQuery) as any[];
    const m = new Map<number, any>();
    for (const c of arr) if (typeof c?.id === 'number') m.set(c.id, c);
    return m;
  }, [(categoriesQuery as any).data, categoriesQuery]);

  const professionById = useMemo(() => {
    const arr = toArray<Profession>((professionsAllQuery as any).data ?? professionsAllQuery) as any[];
    const m = new Map<number, any>();
    for (const p of arr) if (typeof p?.id === 'number') m.set(p.id, p);
    return m;
  }, [(professionsAllQuery as any).data, professionsAllQuery]);

  const selectedCategoriesView = useMemo(() => {
    return selectedCategoryIds.map((id) => {
      const c: any = categoryById.get(id);
      return {
        id,
        label: c ? (c.title ?? c.name ?? c.code ?? c.id) : id,
      };
    });
  }, [selectedCategoryIds, categoryById]);

  const selectedProfessionsView = useMemo(() => {
    const resolved = selectedProfessionIds
      .map((id) => {
        const p: any = professionById.get(id);
        if (!p) return null;
        return { id, label: p.title ?? p.name ?? p.code ?? p.id };
      })
      .filter(Boolean) as Array<{ id: number; label: string }>;

    return resolved;
  }, [selectedProfessionIds, professionById]);

  const scaleLabelByTraitId = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of scales ?? []) {
      const tid = toNumber((s as any).traitId);
      if (typeof tid !== 'number') continue;
      const name = (s as any).name ?? (s as any).code ?? (s as any).tempId;
      const extra =
        (s as any).polarity === 'bipolar' && (s as any).side
          ? ` (${String((s as any).side).toLowerCase()})`
          : '';
      m.set(tid, `${name}${extra}`);
    }
    return m;
  }, [scales]);

  const questionsView = useMemo(() => {
    const qs = (questions ?? []).slice().sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));

    const effectText = (weightsByTraitId: Record<number, number> | undefined) => {
      const w = weightsByTraitId ?? {};
      const entries = Object.entries(w)
        .map(([k, v]) => [Number(k), v] as const)
        .filter(([tid, val]) => Number.isFinite(tid) && typeof val === 'number' && val !== 0);

      if (entries.length === 0) return t('noEffect');

      return entries
        .map(([tid, val]) => {
          const label = scaleLabelByTraitId.get(tid) ?? `trait ${tid}`;
          const sign = val > 0 ? '+' : '';
          return `${label} ${sign}${val}`;
        })
        .join(', ');
    };

    return qs.map((q) => ({
      id: q.tempId,
      ord: q.ord,
      qtype: q.qtype,
      text: q.text,
      options: (q.options ?? [])
        .slice()
        .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0))
        .map((o) => ({
          id: o.tempId,
          ord: o.ord,
          label: o.label,
          effect: effectText((o as any).weightsByTraitId),
        })),
    }));
  }, [questions, scaleLabelByTraitId, t]);

  const actions =
    typeof quizId === 'number' && typeof version === 'number'
      ? useQuizBuilderActions(quizId, version)
      : null;

  async function onPublish() {
    if (!actions || typeof quizId !== 'number') return;

    try {
      await actions.publishQuiz.mutateAsync({ id: quizId } as any);
      message.success(t('published'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

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

        <Typography.Text className="font-medium">{t('questions')}</Typography.Text>
        {questionsView.length === 0 ? (
          <Typography.Text type="secondary">{t('none')}</Typography.Text>
        ) : (
          <div className="flex flex-col gap-3">
            {questionsView.map((q) => (
              <div key={q.id} className="rounded-md border border-neutral-200 p-3">
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
                        {(o.label || t('none'))} — {o.effect || t('noEffect')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <Divider className="!my-3" />

        <Typography.Text className="font-medium">{t('results')}</Typography.Text>

        <div className="mt-2 flex flex-col gap-2">
          <Typography.Text className="font-medium">{t('categories')}</Typography.Text>
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
          <Typography.Text className="font-medium">{t('professions')}</Typography.Text>

          {selectedProfessionsView.length > 0 ? (
            <ul className="list-disc pl-6">
              {selectedProfessionsView.map((p) => (
                <li key={p.id}>{p.label}</li>
              ))}
            </ul>
          ) : typeof selectedCategoryId === 'number' ? (
            allProfessions.length === 0 ? (
              <Typography.Text type="secondary">
                {searchRes.isFetching ? t('loading') : t('noProfessionsInCategory')}
              </Typography.Text>
            ) : (
              <div>
                <ul className="mt-2 list-disc pl-6">
                  {allProfessions.map((p: any) => (
                    <li key={p.id}>{p.title ?? p.name ?? p.code ?? p.id}</li>
                  ))}
                </ul>
                {!allLoaded ? (
                  <div className="mt-2">
                    <Button onClick={() => setPage((s) => s + 1)} loading={searchRes.isFetching}>
                      {t('loadMore')}
                    </Button>
                  </div>
                ) : null}
              </div>
            )
          ) : (
            <Typography.Text type="secondary">{t('chooseCategoryToSeeProfessions')}</Typography.Text>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="primary"
            size="large"
            onClick={onPublish}
            loading={actions?.publishQuiz.isPending}
            disabled={!actions || typeof quizId !== 'number'}
          >
            {t('publish')}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
