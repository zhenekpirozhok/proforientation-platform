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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="font-medium text-slate-900 dark:text-slate-100">
            {i18n.detailedTitle}
          </div>

          {optionCounts.isLoading ? (
            <div className="text-xs text-slate-500 dark:text-slate-400">…</div>
          ) : optionCounts.error ? (
            <div className="text-xs text-amber-700 dark:text-amber-300">
              {i18n.failed}:{' '}
              {optionCounts.error instanceof Error
                ? optionCounts.error.message
                : String(optionCounts.error)}
            </div>
          ) : null}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-700 dark:border-slate-800 dark:text-slate-200">
                <th className="py-2 pr-4 whitespace-nowrap">{i18n.qNumber}</th>
                <th className="py-2 pr-4 whitespace-nowrap">
                  {i18n.modeChoice}
                </th>
                <th className="py-2 pr-4 whitespace-nowrap">{i18n.answers}</th>
                <th className="py-2 pr-4 whitespace-nowrap">{i18n.discNorm}</th>
                <th className="py-2 pr-4 whitespace-nowrap">{i18n.quality}</th>
                <th className="py-2 pr-4 whitespace-nowrap">
                  {i18n.distribution}
                </th>
              </tr>
            </thead>

            <tbody className="text-slate-900 dark:text-slate-100">
              {rows.map((r) => (
                <tr
                  key={r.questionId}
                  className="border-b border-slate-200 align-top dark:border-slate-800"
                >
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {r.questionOrd ?? i18n.notAvailable}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {r.modeChoice ?? i18n.notAvailable}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {r.answersCount ?? i18n.notAvailable}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {r.discNorm ?? i18n.notAvailable}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {r.discQuality ?? i18n.notAvailable}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="min-w-[180px]">
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 space-y-3 sm:hidden">
          {rows.map((r) => (
            <div
              key={r.questionId}
              className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">
                  {i18n.qNumber}:{' '}
                  <span className="font-semibold">
                    {r.questionOrd ?? i18n.notAvailable}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {i18n.modeChoice}:{' '}
                  <span className="text-slate-900 dark:text-slate-100">
                    {r.modeChoice ?? i18n.notAvailable}
                  </span>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900">
                  <div className="text-slate-500 dark:text-slate-400">
                    {i18n.answers}
                  </div>
                  <div className="text-slate-900 dark:text-slate-100">
                    {r.answersCount ?? i18n.notAvailable}
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900">
                  <div className="text-slate-500 dark:text-slate-400">
                    {i18n.discNorm}
                  </div>
                  <div className="text-slate-900 dark:text-slate-100">
                    {r.discNorm ?? i18n.notAvailable}
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900">
                  <div className="text-slate-500 dark:text-slate-400">
                    {i18n.quality}
                  </div>
                  <div className="text-slate-900 dark:text-slate-100">
                    {r.discQuality ?? i18n.notAvailable}
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900">
                  <div className="text-slate-500 dark:text-slate-400">
                    {i18n.distribution}
                  </div>
                  <div className="mt-1">
                    {optionCounts.isLoading ? (
                      <span className="text-slate-400 dark:text-slate-500">
                        …
                      </span>
                    ) : optionCounts.error ? (
                      <span className="text-red-600 dark:text-red-400">
                        {i18n.failed}
                      </span>
                    ) : (
                      <MiniOptionHistogram
                        distribution={r.distribution}
                        optionsCount={optionCounts.data?.[r.questionId] ?? 0}
                        ariaLabel={i18n.distribution}
                        heightPx={28}
                        barWidthPx={7}
                        gapPx={5}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {optionCounts.error && (
          <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Could not load option counts: {String(optionCounts.error)}
          </div>
        )}
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
                className={c > 0 ? 'w-full bg-[#4E51DE]' : 'w-full bg-transparent'}
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
