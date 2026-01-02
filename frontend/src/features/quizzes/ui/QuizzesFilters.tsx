'use client';

import { Card, Input, Select, Drawer, Button } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ProfessionCategoryDto } from '@/shared/api/generated/model';

type FiltersValue = {
  q: string;
  category: string;
  duration: string;
};

type Props = {
  value: FiltersValue;
  onChange: (next: FiltersValue) => void;
  onClear: () => void;
  categories: ProfessionCategoryDto[];
};

function hasActiveFilters(v: FiltersValue) {
  return Boolean(v.q.trim()) || v.category !== 'all' || v.duration !== 'any';
}

export function QuizzesFilters({
  value,
  onChange,
  onClear,
  categories,
}: Props) {
  const t = useTranslations('Quizzes');
  const [open, setOpen] = useState(false);

  const active = hasActiveFilters(value);

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: t('allCategories') },
      ...categories
        .filter((c) => typeof c.id === 'number')
        .map((c) => ({
          value: String(c.id),
          label: c.name ?? String(c.id),
        })),
    ],
    [categories, t],
  );

  const durationOptions = useMemo(
    () => [
      { value: 'any', label: t('anyDuration') },
      { value: 'short', label: t('durationShort') },
      { value: 'mid', label: t('durationMid') },
      { value: 'long', label: t('durationLong') },
    ],
    [t],
  );

  const FiltersForm = (
    <div className="grid gap-3">
      <Input
        size="large"
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder={t('searchPlaceholder')}
        value={value.q}
        onChange={(e) => onChange({ ...value, q: e.target.value })}
        className="rounded-2xl"
        allowClear
      />

      <Select
        size="large"
        value={value.category}
        onChange={(v) => onChange({ ...value, category: v })}
        className="cp-filter-select"
        classNames={{
          popup: { root: 'cp-filter-dropdown' },
        }}
        options={categoryOptions}
      />

      <Select
        size="large"
        value={value.duration}
        onChange={(v) => onChange({ ...value, duration: v })}
        className="cp-filter-select"
        classNames={{
          popup: { root: 'cp-filter-dropdown' },
        }}
        options={durationOptions}
      />

      <div className="flex items-center justify-between pt-2">
        <Button
          type="link"
          className="px-0"
          onClick={onClear}
          disabled={!active}
        >
          {t('clearFilters')}
        </Button>

        <Button
          type="primary"
          className="rounded-xl"
          onClick={() => setOpen(false)}
        >
          OK
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="mt-6 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-left text-sm font-medium text-slate-900 dark:border-slate-800/70 dark:bg-slate-950 dark:text-slate-100"
        >
          <span className="inline-flex items-center gap-2">
            <FilterOutlined />
            {t('filtersTitle')}
          </span>

          {active ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('filtersActive')}
              </span>
            </span>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('filtersNone')}
            </span>
          )}
        </button>
      </div>

      <Card className="mt-6 hidden rounded-2xl md:block">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            size="large"
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder={t('searchPlaceholder')}
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
            className="rounded-2xl"
            allowClear
          />

          <Select
            size="large"
            value={value.category}
            onChange={(v) => onChange({ ...value, category: v })}
            options={categoryOptions}
            className="cp-lang-select w-full"
            classNames={{ popup: { root: 'cp-lang-dropdown' } }}
            popupMatchSelectWidth={false}
          />

          <Select
            size="large"
            value={value.duration}
            onChange={(v) => onChange({ ...value, duration: v })}
            options={durationOptions}
            className="cp-lang-select w-full"
            classNames={{ popup: { root: 'cp-lang-dropdown' } }}
            popupMatchSelectWidth={false}
          />
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={onClear}
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            style={{
              opacity: active ? 1 : 0.4,
              pointerEvents: active ? 'auto' : 'none',
            }}
          >
            {t('clearFilters')}
          </button>
        </div>
      </Card>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="bottom"
        size="default"
        styles={{ body: { padding: 16 } }}
        title={t('filtersTitle')}
      >
        {FiltersForm}
      </Drawer>
    </>
  );
}
