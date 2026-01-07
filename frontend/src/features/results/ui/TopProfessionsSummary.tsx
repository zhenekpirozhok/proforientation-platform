'use client';

import { Tag } from 'antd';
import type { ProfessionDto } from '@/shared/api/generated/model';

type TranslateParams = Record<string, string | number>;

type Props = {
  t: (key: string, params?: TranslateParams) => string;
  professions: ProfessionDto[];
};

export function TopProfessionsSummary({ t, professions }: Props) {
  const top = professions.slice(0, 3);

  if (top.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {t('TopProfessionsTitle')}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {top.map((p) => (
          <Tag
            key={p.id ?? p.code ?? p.title}
            className="m-0 rounded-full px-3 py-1 text-sm dark:!bg-slate-900 dark:!border-slate-700 dark:!text-slate-200"
          >
            {p.title ?? t('FallbackProfessionTitle', { id: p.id ?? 0 })}
          </Tag>
        ))}
      </div>
    </div>
  );
}
