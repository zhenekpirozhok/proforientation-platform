'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetQuizVersions } from '@/entities/quiz/api/useGetQuizVersions';

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
        // на мобилке табы не должны сжиматься в кашу
        'px-3 py-2 rounded-lg border transition-colors',
        'border-slate-200 dark:border-slate-800',
        'flex-1 sm:flex-none',
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
        // мобильная адаптация
        'inline-flex items-center justify-center',
        'w-full sm:w-auto',
        'text-sm',
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

  const router = useRouter();

  const [tab, setTab] = useState<'overview' | 'detailed'>('overview');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    quizVersionId,
  );

  const versionsQuery = useGetQuizVersions(quizId);
  const publishedVersions = useMemo(() => {
    const raw = versionsQuery.data ?? [];
    let arr: unknown[] = [];
    if (Array.isArray(raw)) arr = raw as unknown[];
    else if (raw && typeof raw === 'object') {
      const o = raw as Record<string, unknown>;
      if (Array.isArray(o.data)) arr = o.data as unknown[];
      else if (Array.isArray(o.result)) arr = o.result as unknown[];
      else if (Array.isArray(o.payload)) arr = o.payload as unknown[];
      else arr = [];
    }
    const pubs = (arr as Array<Record<string, unknown>>).filter(
      (v) => Boolean((v as Record<string, unknown>)?.publishedAt),
    );
    pubs.sort(
      (a, b) =>
        (Number((b as Record<string, unknown>)?.version) ?? 0) -
        (Number((a as Record<string, unknown>)?.version) ?? 0),
    );
    return pubs as Record<string, unknown>[];
  }, [versionsQuery.data]);

  useEffect(() => {
    if (!versionsQuery.isFetching && !Array.isArray(versionsQuery.data)) {
      void versionsQuery.refetch();
    }
  }, [quizId]);

  const overview = useOverview(
    locale,
    quizId,
    selectedVersionId,
    from || undefined,
    to || undefined,
  );
  const detailed = useDetailed(locale, quizId, selectedVersionId);

  const exportLinks = useMemo(() => {
    const qs = new URLSearchParams({ quizVersionId: selectedVersionId });
    const base = `/api/admin/quizzes/${quizId}/analytics/export`;
    return {
      overviewCsv: `${base}/overview.csv?${qs}`,
      overviewXlsx: `${base}/overview.xlsx?${qs}`,
      detailedCsv: `${base}/detailed.csv?${qs}`,
      detailedXlsx: `${base}/detailed.xlsx?${qs}`,
    };
  }, [locale, quizId, selectedVersionId]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {i18n.title}
          </h1>
          <div className="text-sm text-slate-500 dark:text-slate-400 break-words">
            Quiz ID: {quizId} • Version: {quizVersionId}
          </div>
        </div>

        <Link
          className={[
            'px-3 py-2 rounded-lg border transition-colors',
            'border-slate-200 bg-white hover:bg-slate-50 text-slate-900',
            'dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100',
            // мобилка: кнопка на всю ширину
            'inline-flex items-center justify-center',
            'w-full sm:w-auto',
          ].join(' ')}
          href={`/admin/quizzes/${quizId}/edit`}
        >
          {i18n.editQuiz}
        </Link>
      </div>

      {/* Version select */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-sm text-slate-600 dark:text-slate-300">
          {i18n.version}
        </label>
        <select
          value={selectedVersionId}
          onChange={(e) => {
            const v = e.target.value;
            setSelectedVersionId(v);
            const url = new URL(window.location.href);
            if (v) url.searchParams.set('quizVersionId', v);
            else url.searchParams.delete('quizVersionId');
            router.replace(url.toString());
          }}
          className="w-full sm:w-[360px] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
        >
          {publishedVersions.length === 0 ? (
            <option value="">{i18n.noPublishedVersions}</option>
          ) : null}
          {publishedVersions.map((v) => {
            const id = String((v as Record<string, unknown>)?.id ?? '');
            const ver = String((v as Record<string, unknown>)?.version ?? id);
            const label =
              (v as Record<string, unknown>)?.title ||
              (v as Record<string, unknown>)?.name ||
              `v${ver}`;
            return (
              <option key={id} value={id}>
                {String(label)}
              </option>
            );
          })}
        </select>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-600 dark:text-slate-300">
              {i18n.from}
            </label>
            <input
              type="date"
              className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
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
              className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
          {i18n.overview}
        </TabButton>
        <TabButton active={tab === 'detailed'} onClick={() => setTab('detailed')}>
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
          quizVersionId={selectedVersionId}
          data={detailed.data}
          loading={detailed.isLoading}
          error={detailed.error?.message}
        />
      )}
    </div>
  );
}
