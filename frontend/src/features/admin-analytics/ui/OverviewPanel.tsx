'use client';

import type { QuizAnalyticsOverviewDto } from '../model/types';
import { formatDurationSeconds, formatPercent01 } from '../lib/format';
import { t } from '../i18n';

type Props = {
  locale: string;
  data?: QuizAnalyticsOverviewDto;
  loading: boolean;
  error?: string;
};

export function OverviewPanel({ locale, data, loading, error }: Props) {
  const i18n = t(locale);

  if (loading) {
    return (
      <div className="text-slate-500 dark:text-slate-400">
        {i18n.loadingOverview}
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title={i18n.startedAttempts} value={data.attemptsStarted} />
        <StatCard
          title={i18n.completedAttempts}
          value={data.attemptsCompleted}
        />
        <StatCard
          title={i18n.completionRate}
          value={formatPercent01(data.completionRate)}
        />
        <StatCard
          title={i18n.avgCompletionTime}
          value={formatDurationSeconds(data.avgDurationSeconds)}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {i18n.activityTrends}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-700 dark:text-slate-200">
                <th className="py-2 pr-4 whitespace-nowrap">{i18n.day}</th>
                <th className="py-2 pr-4 whitespace-nowrap">{i18n.started}</th>
                <th className="py-2 pr-4 whitespace-nowrap">{i18n.completed}</th>
                <th className="py-2 pr-4 whitespace-nowrap">
                  {i18n.avgDuration}
                </th>
              </tr>
            </thead>

            <tbody className="text-slate-900 dark:text-slate-100">
              {data.activityDaily.map((p) => (
                <tr
                  key={p.day}
                  className="border-b border-slate-200 dark:border-slate-800"
                >
                  <td className="py-2 pr-4 whitespace-nowrap">{p.day}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{p.started}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{p.completed}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {formatDurationSeconds(p.avgDurationSeconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 space-y-3 sm:hidden">
          {data.activityDaily.map((p) => (
            <div
              key={p.day}
              className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {p.day}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {i18n.avgDuration}:{' '}
                  <span className="text-slate-900 dark:text-slate-100">
                    {formatDurationSeconds(p.avgDurationSeconds)}
                  </span>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900">
                  <div className="text-slate-500 dark:text-slate-400">
                    {i18n.started}
                  </div>
                  <div className="text-slate-900 dark:text-slate-100">
                    {p.started}
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-900">
                  <div className="text-slate-500 dark:text-slate-400">
                    {i18n.completed}
                  </div>
                  <div className="text-slate-900 dark:text-slate-100">
                    {p.completed}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard(props: { title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        {props.title}
      </div>
      <div className="text-xl sm:text-2xl font-semibold mt-1 text-slate-900 dark:text-slate-100">
        {props.value}
      </div>
    </div>
  );
}
