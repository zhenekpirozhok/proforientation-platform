'use client';

import { useMemo } from 'react';

import type { QuizAnalyticsDetailedDto } from '../model/types';
import { buildQuestionMetricsRows } from '../model/selectors';
import { t } from '../i18n';
import { useQuestionOptionCounts } from '../api/useQuestionOptionCounts';

type Props = {
  locale: string;
  quizId: string;
  quizVersionId: string;

  data?: QuizAnalyticsDetailedDto;
  loading: boolean;
  error?: string;
};

export function DetailedPanel({
  locale,
  quizId,
  quizVersionId,
  data,
  loading,
  error,
}: Props) {
  const i18n = t(locale);

  // ✅ Hook must be called unconditionally (before any early return)
  const optionCounts = useQuestionOptionCounts(locale, quizId, quizVersionId);

  const rows = useMemo(() => {
    return data ? buildQuestionMetricsRows(data) : [];
  }, [data]);

  if (loading) {
    return (
      <div className="text-slate-500 dark:text-slate-400">
        {i18n.loadingDetailed}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400">
        {i18n.failed} {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-slate-500 dark:text-slate-400">{i18n.noData}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {i18n.detailedTitle}
        </div>

        <div className="mt-3 overflow-auto">
          <table className="min-w-250 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-700 dark:border-slate-800 dark:text-slate-200">
                <th className="py-2 pr-4">{i18n.qNumber}</th>
                <th className="py-2 pr-4">{i18n.modeChoice}</th>
                <th className="py-2 pr-4">{i18n.answers}</th>
                <th className="py-2 pr-4">{i18n.discNorm}</th>
                <th className="py-2 pr-4">{i18n.quality}</th>
                <th className="py-2 pr-4">{i18n.distribution}</th>
              </tr>
            </thead>

            <tbody className="text-slate-900 dark:text-slate-100">
              {rows.map((r) => (
                <tr
                  key={r.questionId}
                  className="border-b border-slate-200 align-top dark:border-slate-800"
                >
                  <td className="py-2 pr-4">
                    {r.questionOrd ?? i18n.notAvailable}
                  </td>
                  <td className="py-2 pr-4">
                    {r.modeChoice ?? i18n.notAvailable}
                  </td>
                  <td className="py-2 pr-4">
                    {r.answersCount ?? i18n.notAvailable}
                  </td>
                  <td className="py-2 pr-4">
                    {r.discNorm ?? i18n.notAvailable}
                  </td>
                  <td className="py-2 pr-4">
                    {r.discQuality ?? i18n.notAvailable}
                  </td>
                  <td className="py-2 pr-4">
                    {optionCounts.isLoading ? (
                      <span className="text-slate-400 dark:text-slate-500">
                        …
                      </span>
                    ) : optionCounts.error ? (
                      <span className="text-red-600 dark:text-red-400">
                        {i18n.failed}:{' '}
                        {optionCounts.error instanceof Error
                          ? optionCounts.error.message
                          : String(optionCounts.error)}
                      </span>
                    ) : (
                      <MiniOptionHistogram
                        distribution={r.distribution}
                        optionsCount={optionCounts.data?.[r.questionId] ?? 0}
                        ariaLabel={i18n.distribution}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {optionCounts.error && (
            <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              Could not load option counts: {String(optionCounts.error)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type Dist = Array<{ optionOrd: number; count: number }>;

export function MiniOptionHistogram(props: {
  distribution?: Dist;
  optionsCount: number;
  heightPx?: number;
  barWidthPx?: number;
  gapPx?: number;
  ariaLabel?: string;
}) {
  const {
    distribution = [],
    optionsCount,
    heightPx = 32,
    barWidthPx = 8,
    gapPx = 6,
    ariaLabel,
  } = props;

  const n = Math.max(optionsCount, 0);
  if (n === 0) {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }

  const counts = Array.from({ length: n }, () => 0);
  for (const d of distribution) {
    const ord = d.optionOrd ?? 0;
    if (ord >= 1 && ord <= n) counts[ord - 1] = d.count ?? 0;
  }

  const max = Math.max(...counts, 1);

  return (
    <div
      className="flex items-end"
      style={{ gap: gapPx }}
      role="img"
      aria-label={ariaLabel ?? 'distribution'}
      title={counts.map((c, i) => `opt${i + 1}: ${c}`).join(' | ')}
    >
      {counts.map((c, idx) => {
        const pct = (c / max) * 100;

        return (
          <div
            key={idx}
            className="flex flex-col items-center"
            style={{ gap: 4 }}
          >
            <div
              className="flex items-end overflow-hidden rounded bg-slate-200 dark:bg-slate-800"
              style={{ height: heightPx, width: barWidthPx }}
            >
              <div
                className={
                  c > 0 ? 'w-full bg-[#4E51DE]' : 'w-full bg-transparent'
                }
                style={{ height: `${pct}%` }}
              />
            </div>

            <div className="text-[10px] leading-none text-slate-600 dark:text-slate-300">
              {idx + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
