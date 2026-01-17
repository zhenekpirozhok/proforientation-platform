'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useDetailed, useOverview } from '../api/hooks';
import { OverviewPanel } from './OverviewPanel';
import { DetailedPanel } from './DetailedPanel';
import { t } from '../i18n';

function TabButton(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={props.onClick}
      type="button"
      className={[
        'px-3 py-2 rounded-lg border transition-colors',
        'border-slate-200 dark:border-slate-800',
        props.active
          ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
          : 'bg-white hover:bg-slate-50 text-slate-900 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100',
      ].join(' ')}
    >
      {props.children}
    </button>
  );
}

function ActionLink(props: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={props.href}
      className={[
        'px-3 py-2 rounded-lg border transition-colors',
        'border-slate-200 bg-white hover:bg-slate-50 text-slate-900',
        'dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100',
      ].join(' ')}
    >
      {props.children}
    </a>
  );
}

export function QuizAnalyticsScreen(props: {
  locale: string;
  quizId: string;
  quizVersionId: string;
}) {
  const { locale, quizId, quizVersionId } = props;
  const i18n = t(locale);

  const [tab, setTab] = useState<'overview' | 'detailed'>('overview');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const overview = useOverview(
    locale,
    quizId,
    quizVersionId,
    from || undefined,
    to || undefined,
  );
  const detailed = useDetailed(locale, quizId, quizVersionId);

  const exportLinks = useMemo(() => {
    const qs = new URLSearchParams({ quizVersionId });
    const base = `/${locale}/api/admin/quizzes/${quizId}/analytics/export`;
    return {
      overviewCsv: `${base}/overview.csv?${qs}`,
      overviewXlsx: `${base}/overview.xlsx?${qs}`,
      detailedCsv: `${base}/detailed.csv?${qs}`,
      detailedXlsx: `${base}/detailed.xlsx?${qs}`,
    };
  }, [locale, quizId, quizVersionId]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {i18n.title}
          </h1>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Quiz ID: {quizId} • Version: {quizVersionId}
          </div>
        </div>

        <Link
          className={[
            'px-3 py-2 rounded-lg border transition-colors',
            'border-slate-200 bg-white hover:bg-slate-50 text-slate-900',
            'dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100',
          ].join(' ')}
          href={`/admin/quizzes/${quizId}/edit`}
        >
          {i18n.editQuiz}
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600 dark:text-slate-300">
            {i18n.from}
          </label>
          <input
            type="date"
            className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600 dark:text-slate-300">
            {i18n.to}
          </label>
          <input
            type="date"
            className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="ml-auto flex flex-wrap gap-2">
          <ActionLink href={exportLinks.overviewCsv}>
            {i18n.exportOverviewCsv}
          </ActionLink>
          <ActionLink href={exportLinks.overviewXlsx}>
            {i18n.exportOverviewXlsx}
          </ActionLink>
          <ActionLink href={exportLinks.detailedCsv}>
            {i18n.exportDetailedCsv}
          </ActionLink>
          <ActionLink href={exportLinks.detailedXlsx}>
            {i18n.exportDetailedXlsx}
          </ActionLink>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <TabButton
          active={tab === 'overview'}
          onClick={() => setTab('overview')}
        >
          {i18n.overview}
        </TabButton>
        <TabButton
          active={tab === 'detailed'}
          onClick={() => setTab('detailed')}
        >
          {i18n.detailed}
        </TabButton>
      </div>

      {tab === 'overview' ? (
        <OverviewPanel
          locale={locale}
          data={overview.data}
          loading={overview.isLoading}
          error={overview.error?.message}
        />
      ) : (
        <DetailedPanel
          locale={locale}
          quizId={quizId}
          quizVersionId={quizVersionId}
          data={detailed.data}
          loading={detailed.isLoading}
          error={detailed.error?.message}
        />
      )}
    </div>
  );
}
