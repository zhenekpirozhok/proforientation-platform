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
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

      {/* Activity table */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {i18n.activityTrends}
        </div>

        <table className="min-w-200 w-full text-sm mt-3">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-700 dark:text-slate-200">
              <th className="py-2 pr-4">{i18n.day}</th>
              <th className="py-2 pr-4">{i18n.started}</th>
              <th className="py-2 pr-4">{i18n.completed}</th>
              <th className="py-2 pr-4">{i18n.avgDuration}</th>
            </tr>
          </thead>

          <tbody className="text-slate-900 dark:text-slate-100">
            {data.activityDaily.map((p) => (
              <tr
                key={p.day}
                className="border-b border-slate-200 dark:border-slate-800"
              >
                <td className="py-2 pr-4">{p.day}</td>
                <td className="py-2 pr-4">{p.started}</td>
                <td className="py-2 pr-4">{p.completed}</td>
                <td className="py-2 pr-4">
                  {formatDurationSeconds(p.avgDurationSeconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard(props: { title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {props.title}
      </div>
      <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-slate-100">
        {props.value}
      </div>
    </div>
  );
}
