'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/shared/i18n/lib/navigation';
import { Alert, Card, Input, Select, Skeleton, Empty, Button, Tag } from 'antd';

import { useMyAttemptsQuery } from '@/entities/attempt/api/useMyAttemptsQuery';
import { useAttemptResultQuery } from '@/entities/attempt/api/useAttemptResultQuery';
import { TraitsSliders } from '@/features/results/ui/TraitsSliders';
import { CareerMatches } from '@/features/results/ui/CareerMatches';
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

export default function MyResultsPage() {
  const t = useTranslations('MyResultsPage');
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);

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

  const resultQuery = useAttemptResultQuery(resolvedSelectedId);
  if (resultQuery.isError) throwIfForbidden(resultQuery.error);

  const traitRows = useMemo(() => {
    const r: any = resultQuery.data;
    const scores = Array.isArray(r?.traitScores) ? r.traitScores : [];
    return scores
      .slice()
      .sort((a: any, b: any) => (b?.score ?? 0) - (a?.score ?? 0))
      .map((s: any) => ({
        key: String(s?.traitCode ?? s?.code ?? Math.random()),
        label: String(s?.traitName ?? s?.traitCode ?? ''),
        description: s?.description ? String(s.description) : undefined,
        value: typeof s?.score === 'number' ? s.score : 0,
      }));
  }, [resultQuery.data]);

  const professionRows = useMemo(() => {
    const r: any = resultQuery.data;
    const recs = Array.isArray(r?.recommendations) ? r.recommendations : [];
    return recs
      .slice()
      .sort((a: any, b: any) => (b?.score ?? 0) - (a?.score ?? 0))
      .map((rec: any) => ({
        id: Number(rec?.professionId ?? rec?.id ?? 0),
        title: String(rec?.title ?? rec?.professionTitle ?? rec?.name ?? t('FallbackProfessionTitle', { id: rec?.professionId ?? 0 })),
        description: rec?.description ? String(rec.description) : undefined,
        score01: typeof rec?.score === 'number' ? rec.score : 0,
      }));
  }, [resultQuery.data, t]);

  const headerTitle = useMemo(() => {
    const title = String(selectedAttempt?.quizTitle ?? selectedAttempt?.quizName ?? '').trim() || t('DefaultQuizTitle');
    return title;
  }, [selectedAttempt?.quizTitle, selectedAttempt?.quizName, t]);

  const headerDate = useMemo(() => {
    const iso = selectedAttempt?.submittedAt ?? selectedAttempt?.finishedAt ?? selectedAttempt?.createdAt;
    return formatDate(locale, iso);
  }, [locale, selectedAttempt?.createdAt, selectedAttempt?.submittedAt, selectedAttempt?.finishedAt]);

  const topScore = useMemo(() => {
    const r: any = resultQuery.data;
    const recs = Array.isArray(r?.recommendations) ? r.recommendations : [];
    const best = recs.slice().sort((a: any, b: any) => (b?.score ?? 0) - (a?.score ?? 0))[0];
    return toPercent01(best?.score);
  }, [resultQuery.data]);

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
              <div className="space-y-2">
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
                      onClick={() => setSelectedAttemptId(id)}
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

            {resultQuery.isError ? (
              <Alert
                type="error"
                showIcon
                message={resultQuery.error instanceof Error ? resultQuery.error.message : t('ResultLoadError')}
              />
            ) : resultQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton active paragraph={{ rows: 3 }} />
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">{t('TraitsTitle')}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">{t('TraitsSubtitle')}</div>
                  <div className="mt-4">
                    <TraitsSliders title="" rows={traitRows} />
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">{t('ProfessionsTitle')}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">{t('ProfessionsSubtitle')}</div>
                  <div className="mt-4">
                    <CareerMatches title="" subtitle="" rows={professionRows.slice(0, 6)} matchLabel={t('Match')} />
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button onClick={() => router.push('/quizzes')}>{t('TakeAnother')}</Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        if (resolvedSelectedId) router.push(`/results/${resolvedSelectedId}`);
                      }}
                    >
                      {t('OpenDetails')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
