'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/shared/i18n/lib/navigation';
import { Alert, Card, Input, Select, Skeleton, Empty, Button, Tag, message } from 'antd';

import { useMyAttemptsQuery } from '@/entities/attempt/api/useMyAttemptsQuery';
import { useAttemptViewQuery } from '@/entities/attempt/api/useAttemptViewQuery';
import { TraitsSliders } from '@/features/results/ui/TraitsSliders';
import { HttpError } from '@/shared/api/httpError';

type SortKey = 'newest' | 'oldest';

function safeDate(v?: string) {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDate(locale: string, iso?: string) {
  const d = safeDate(iso);
  if (!d) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
}

function toPercent01(v?: number) {
  const n = typeof v === 'number' ? v : 0;
  const clamped = Math.max(0, Math.min(1, n));
  return Math.round(clamped * 100);
}

function throwIfForbidden(e: unknown) {
  if (e instanceof HttpError && (e.status === 401 || e.status === 403)) throw e;
}

type TraitsRow = { key: string; label: string; value: number };
type ProfessionRow = { id: number; title: string; score01: number };

function ProfessionCards(props: {
  title: string;
  subtitle?: string;
  rows: ProfessionRow[];
  visibleCount: number;
  showAll: boolean;
  onToggleShowAll: () => void;
  t: (k: string, p?: any) => string;
}) {
  const { title, subtitle, rows, visibleCount, showAll, onToggleShowAll, t } = props;

  const visible = showAll ? rows : rows.slice(0, visibleCount);

  return (
    <Card className="dark:!bg-slate-950 dark:!border-slate-800">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</div>
          {subtitle ? <div className="text-xs text-slate-600 dark:text-slate-300">{subtitle}</div> : null}
        </div>

        {rows.length > visibleCount ? (
          <Button type="link" className="px-0" onClick={onToggleShowAll}>
            {showAll ? t('ShowLess') : t('ShowMore')}
          </Button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('EmptyProfessions')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visible.map((p) => {
            const pct = toPercent01(p.score01);
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900/40"
              >
                <div className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{p.title}</div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-300">{t('Match')}</div>
                  <div className="rounded-full bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                    {pct}%
                  </div>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function MyResultsPage() {
  const t = useTranslations('MyResultsPage');
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [showAllTraits, setShowAllTraits] = useState(false);
  const [showAllProfessions, setShowAllProfessions] = useState(false);

  const attemptsQuery = useMyAttemptsQuery();
  if (attemptsQuery.isError) throwIfForbidden(attemptsQuery.error);

  const attemptsRaw = attemptsQuery.data?.list ?? [];

  const attempts = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = attemptsRaw
      .filter((a: any) => a?.isCompleted === true || a?.status === 'completed')
      .filter((a: any) => {
        if (!q) return true;
        const title = String(a?.quizTitle ?? a?.quizName ?? a?.quizCode ?? '').toLowerCase();
        return title.includes(q);
      });

    filtered.sort((a: any, b: any) => {
      const da = safeDate(a?.submittedAt ?? a?.finishedAt ?? a?.createdAt)?.getTime() ?? 0;
      const db = safeDate(b?.submittedAt ?? b?.finishedAt ?? b?.createdAt)?.getTime() ?? 0;
      return sort === 'newest' ? db - da : da - db;
    });

    return filtered;
  }, [attemptsRaw, query, sort]);

  const resolvedSelectedId = useMemo(() => {
    if (selectedAttemptId != null) return selectedAttemptId;
    const first: any = attempts[0];
    const id =
      typeof first?.id === 'number'
        ? first.id
        : typeof first?.attemptId === 'number'
          ? first.attemptId
          : null;
    return id;
  }, [attempts, selectedAttemptId]);

  const selectedAttempt = useMemo(() => {
    if (!resolvedSelectedId) return null;
    return (attempts as any[]).find((a) => a?.id === resolvedSelectedId || a?.attemptId === resolvedSelectedId) ?? null;
  }, [attempts, resolvedSelectedId]);

  const viewQuery = useAttemptViewQuery(resolvedSelectedId);
  if (viewQuery.isError) throwIfForbidden(viewQuery.error);

  const traitRowsAll: TraitsRow[] = useMemo(() => {
    const traits = viewQuery.data?.traits ?? [];
    return traits
      .slice()
      .sort((a, b) => (b.score01 ?? 0) - (a.score01 ?? 0))
      .map((s) => ({
        key: s.code,
        label: s.name,
        value: typeof s.score01 === 'number' ? s.score01 : 0,
      }));
  }, [viewQuery.data]);

  const traitRows: TraitsRow[] = useMemo(() => {
    if (showAllTraits) return traitRowsAll;
    return traitRowsAll.slice(0, 3);
  }, [traitRowsAll, showAllTraits]);

  const professionRowsAll: ProfessionRow[] = useMemo(() => {
    const profs = viewQuery.data?.professions ?? [];
    return profs
      .slice()
      .sort((a, b) => (b.score01 ?? 0) - (a.score01 ?? 0))
      .map((p) => ({
        id: p.id,
        title: p.title || t('FallbackProfessionTitle', { id: p.id }),
        score01: typeof p.score01 === 'number' ? p.score01 : 0,
      }));
  }, [viewQuery.data, t]);

  const headerTitle = useMemo(() => {
    return String(selectedAttempt?.quizTitle ?? selectedAttempt?.quizName ?? '').trim() || t('DefaultQuizTitle');
  }, [selectedAttempt?.quizTitle, selectedAttempt?.quizName, t]);

  const headerDate = useMemo(() => {
    const iso = selectedAttempt?.submittedAt ?? selectedAttempt?.finishedAt ?? selectedAttempt?.createdAt;
    return formatDate(locale, iso);
  }, [locale, selectedAttempt?.createdAt, selectedAttempt?.submittedAt, selectedAttempt?.finishedAt]);

  const topScore = useMemo(() => {
    const best = professionRowsAll[0];
    return toPercent01(best?.score01);
  }, [professionRowsAll]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t('Title')}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('Subtitle')}</p>
      </div>

      {attemptsQuery.isError ? (
        <Alert
          type="error"
          showIcon
          message={attemptsQuery.error instanceof Error ? attemptsQuery.error.message : t('LoadError')}
          className="mb-4"
        />
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('SearchPlaceholder')}
          className="sm:max-w-[360px]"
          allowClear
        />
        <Select
          value={sort}
          onChange={(v) => setSort(v)}
          options={[
            { value: 'newest', label: t('SortNewest') },
            { value: 'oldest', label: t('SortOldest') },
          ]}
          className="sm:w-[220px]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6">
            <Card className="dark:!bg-slate-950 dark:!border-slate-800">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('AttemptsTitle')}</div>
                <Tag className="dark:!bg-slate-900 dark:!border-slate-700 dark:!text-slate-200">{attempts.length}</Tag>
              </div>

              {attemptsQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton active paragraph={{ rows: 2 }} />
                  <Skeleton active paragraph={{ rows: 2 }} />
                  <Skeleton active paragraph={{ rows: 2 }} />
                </div>
              ) : attempts.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span className="text-slate-600 dark:text-slate-300">{t('Empty')}</span>}
                >
                  <Button type="primary" onClick={() => router.push('/quizzes')}>
                    {t('GoToQuizzes')}
                  </Button>
                </Empty>
              ) : (
                <div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
                  {attempts.map((a: any) => {
                    const id = typeof a?.id === 'number' ? a.id : a?.attemptId;
                    if (typeof id !== 'number') return null;

                    const title = String(a?.quizTitle ?? a?.quizName ?? '').trim() || t('DefaultQuizTitle');
                    const iso = a?.submittedAt ?? a?.finishedAt ?? a?.createdAt;
                    const date = formatDate(locale, iso);
                    const active = resolvedSelectedId === id;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedAttemptId(id);
                          setShowAllTraits(false);
                          setShowAllProfessions(false);
                        }}
                        className={[
                          'w-full rounded-lg border px-3 py-2 text-left transition',
                          active
                            ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/40'
                            : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/40',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{title}</div>
                            <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{date || t('UnknownDate')}</div>
                          </div>

                          {active ? (
                            <Tag color="blue" className="shrink-0">
                              {t('Selected')}
                            </Tag>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="lg:col-span-8">
          <Card className="dark:!bg-slate-950 dark:!border-slate-800">
            <div className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{headerTitle}</div>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span>{headerDate || t('UnknownDate')}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>
                {t('TopMatchLabel')} {topScore}%
              </span>
            </div>

            {viewQuery.isError ? (
              <Alert type="error" showIcon message={viewQuery.error instanceof Error ? viewQuery.error.message : t('ResultLoadError')} />
            ) : viewQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton active paragraph={{ rows: 3 }} />
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="dark:!bg-slate-950 dark:!border-slate-800" bordered={false}>
                  <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {t('TopProfessionsTitle')}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {professionRowsAll.slice(0, 3).map((p) => (
                      <Tag key={p.id} className="dark:!bg-slate-900 dark:!border-slate-700 dark:!text-slate-200">
                        {p.title}
                      </Tag>
                    ))}
                  </div>
                </Card>

                <Card className="dark:!bg-slate-950 dark:!border-slate-800">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('TraitsTitle')}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">{t('TraitsSubtitle')}</div>
                    </div>

                    {traitRowsAll.length > 3 ? (
                      <Button type="link" className="px-0" onClick={() => setShowAllTraits((v) => !v)}>
                        {showAllTraits ? t('ShowLess') : t('ShowMore')}
                      </Button>
                    ) : null}
                  </div>

                  <TraitsSliders title="" rows={traitRows} />
                </Card>

                <ProfessionCards
                  title={t('ProfessionsTitle')}
                  subtitle={t('ProfessionsSubtitle')}
                  rows={professionRowsAll}
                  visibleCount={6}
                  showAll={showAllProfessions}
                  onToggleShowAll={() => setShowAllProfessions((v) => !v)}
                  t={t as any}
                />

                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button onClick={() => router.push('/quizzes')}>{t('TakeAnother')}</Button>
                  <Button
                    type="primary"
                    onClick={() => message.info(t('PdfSoon'))}
                  >
                    {t('DownloadPdf')}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
