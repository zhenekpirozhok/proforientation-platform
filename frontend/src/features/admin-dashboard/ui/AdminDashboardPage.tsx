'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, Empty, Tag, Typography, message, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { useAdminQuizzes } from '@/entities/quiz/api/useAdminQuizzes';
import { useAdminPublishQuiz } from '@/entities/quiz/api/useAdminPublishQuiz';
import { useAdminDeleteQuiz } from '@/entities/quiz/api/useAdminDeleteQuiz';
import { getGetAllQueryKey } from '@/shared/api/generated/api';
import { QuizzesPagination } from '@/entities/quiz/ui/QuizzesPagination';

import { pickLatestQuizVersion } from '@/shared/lib/quizVersion';

function toArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (!v || typeof v !== 'object') return [];
  const o = v as Record<string, unknown>;

  if (Array.isArray(o.items)) return o.items as T[];
  if (Array.isArray(o.results)) return o.results as T[];
  if (Array.isArray(o.rows)) return o.rows as T[];
  if (Array.isArray(o.content)) return o.content as T[];

  if (o.data !== undefined) return toArray<T>(o.data);
  if (o.result !== undefined) return toArray<T>(o.result);
  if (o.payload !== undefined) return toArray<T>(o.payload);

  return [];
}

function pickTotal(v: unknown): number | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;

  const candidates = [
    o['total'],
    o['totalElements'],
    o['totalCount'],
    o['count'],
    (o['meta'] as Record<string, unknown> | undefined)?.total,
    (o['page'] as Record<string, unknown> | undefined)?.totalElements,
  ];

  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }

  return undefined;
}

function pickPage(v: unknown): number | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;

  const candidates = [
    o['page'] as Record<string, unknown> | undefined,
    o['pageNumber'],
    o['number'],
    (o['meta'] as Record<string, unknown> | undefined)?.page,
    (o['page'] as Record<string, unknown> | undefined)?.number,
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }
  return undefined;
}

function pickSize(v: unknown): number | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;

  const candidates = [
    o['size'],
    o['pageSize'],
    (o['meta'] as Record<string, unknown> | undefined)?.size,
    (o['page'] as Record<string, unknown> | undefined)?.size,
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }
  return undefined;
}

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}

function isVersionPublished(version: unknown): boolean {
  if (!version || typeof version !== 'object') return false;
  return Boolean((version as Record<string, unknown>).publishedAt);
}

function formatDate(v: unknown): string | null {
  if (!v) return null;
  try {
    const d = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString();
  } catch {
    return null;
  }
}

const EDIT_ROUTE = (id: number) => `/admin/quizzes/${id}/edit`;
const ANALYTICS_ROUTE = (id: number) => `/admin/quizzes/${id}/analytics`;
const TRANSLATIONS_ROUTE = (id: number) => `/admin/quizzes/${id}/translations`;

function toId(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function AdminDashboardPage() {
  const t = useTranslations('AdminDashboard');
  const router = useRouter();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(12);

  const quizzesQuery = useAdminQuizzes({
    page: String(page),
    size: String(size),
  });
  const publishQuiz = useAdminPublishQuiz();
  const deleteQuiz = useAdminDeleteQuiz();

  const [deletingQuizId, setDeletingQuizId] = useState<number | null>(null);
  const [publishingQuizId, setPublishingQuizId] = useState<number | null>(null);

  const data = quizzesQuery.data as unknown;
  const items = useMemo(() => toArray<Record<string, unknown>>(data), [data]);

  const total = useMemo(() => {
    const tt = pickTotal(data);
    return typeof tt === 'number' ? tt : items.length;
  }, [data, items.length]);

  const effectivePage = useMemo(() => {
    const p0 = pickPage(data);
    if (typeof p0 === 'number') return p0 + 1;
    return page;
  }, [data, page]);

  const effectiveSize = useMemo(() => {
    const s0 = pickSize(data);
    return typeof s0 === 'number' ? s0 : size;
  }, [data, size]);

  async function onPublish(quizId: number) {
    try {
      setPublishingQuizId(quizId);

      const versionsRes = await qc.fetchQuery({
        queryKey: ['quiz-versions', quizId],
        queryFn: async () => {
          const res = await fetch(`/api/quizzes/${quizId}/versions`);
          if (!res.ok) {
            let msg = `Failed to load versions (${res.status})`;
            try {
              const body = await res.json();
              msg = body?.message ?? msg;
            } catch {}
            throw new Error(msg);
          }
          return res.json();
        },
      });

      const versions = toArray<Record<string, unknown>>(versionsRes);

      const latest = pickLatestQuizVersion(
        versions as unknown as Record<string, unknown>[],
      );
      const quizVersionId = toId(
        (latest as Record<string, unknown> | undefined)?.id,
      );

      if (!quizVersionId) {
        throw new Error('Latest quiz version id not found');
      }

      if (isVersionPublished(latest)) {
        message.info(
          t('toastAlreadyPublished') || 'This version is already published',
        );
        return;
      }

      await publishQuiz.mutateAsync({ id: quizVersionId });

      await qc.invalidateQueries({ queryKey: getGetAllQueryKey() });
      await quizzesQuery.refetch();
      message.success(t('toastPublished'));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setPublishingQuizId(null);
    }
  }

  async function onAnalytics(quizId: number, fallbackPublishedId: number | null) {
    try {
      const currentRes = await qc.fetchQuery({
        queryKey: ['quiz', 'versions', 'current', quizId],
        queryFn: async () => {
          const res = await fetch(`/api/quizzes/${quizId}/versions/current`);
          if (!res.ok) {
            throw new Error(`Failed to load current version (${res.status})`);
          }
          return res.json();
        },
      });

      const currentId = toId((currentRes as Record<string, unknown>)?.id);
      const versionParam = currentId ?? fallbackPublishedId;

      const analyticsUrl = versionParam
        ? `${ANALYTICS_ROUTE(quizId)}?quizVersionId=${versionParam}`
        : `${ANALYTICS_ROUTE(quizId)}`;

      router.push(analyticsUrl);
    } catch {
      const analyticsUrl = fallbackPublishedId
        ? `${ANALYTICS_ROUTE(quizId)}?quizVersionId=${fallbackPublishedId}`
        : `${ANALYTICS_ROUTE(quizId)}`;
      router.push(analyticsUrl);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Typography.Title level={2} className="!m-0">
            {t('title')}
          </Typography.Title>
          <Typography.Text type="secondary" className="block">
            {t('subtitle')}
          </Typography.Text>
        </div>

        <Button
          type="primary"
          onClick={() => router.push('/admin/quizzes/new')}
        >
          {t('create')}
        </Button>
      </div>

      <div className="mt-6">
        {quizzesQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="!rounded-2xl" loading />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="!rounded-2xl">
            <Empty description={t('empty')} />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((q) => {
              const id = Number(q?.id);
              const title =
                safeStr(q?.title) ||
                safeStr(q?.name) ||
                `Quiz #${safeStr(q?.id)}`;
              const code = safeStr(q?.code);
              const createdAt =
                formatDate(q?.createdAt) ?? formatDate(q?.created) ?? null;
              const updatedAt =
                formatDate(q?.updatedAt) ?? formatDate(q?.updated) ?? null;
              const publishedAt = formatDate(q?.publishedAt) ?? null;

              const quizStatus = safeStr(q?.status) || safeStr(q?.quizStatus);

              const hasDraftAfterPublished = quizStatus === 'UPDATED';

              const hasPublishedVersion =
                quizStatus === 'PUBLISHED' || quizStatus === 'UPDATED';

              const isPublishedWithoutDraft = quizStatus === 'PUBLISHED';

              const publishedObj = (q as Record<string, unknown>)?.published as
                | Record<string, unknown>
                | undefined;
              const publishedId = toId(
                (q as Record<string, unknown>)?.publishedVersionId ??
                  (q as Record<string, unknown>)?.publishedId ??
                  (publishedObj ? publishedObj['id'] : undefined) ??
                  (q as Record<string, unknown>)?.latestPublishedVersionId,
              );

              return (
                <Card
                  key={String(q?.id ?? title)}
                  className="!rounded-2xl"
                  title={
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="truncate font-semibold">{title}</div>
                          {hasDraftAfterPublished && (
                            <Tag
                              color="orange"
                              className="whitespace-nowrap flex-shrink-0"
                            >
                              {t('draftUpdate') || 'Update'}
                            </Tag>
                          )}
                        </div>
                        {code ? (
                          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {code}
                          </div>
                        ) : null}
                      </div>

                      <Tag color={hasPublishedVersion ? 'green' : 'gold'}>
                        {hasPublishedVersion ? t('published') : t('draft')}
                      </Tag>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {createdAt ? (
                        <div>
                          {t('created')}: {createdAt}
                        </div>
                      ) : null}
                      {updatedAt ? (
                        <div>
                          {t('updated')}: {updatedAt}
                        </div>
                      ) : null}
                      {publishedAt ? (
                        <div>
                          {t('publishedAt')}: {publishedAt}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        onClick={() => {
                          if (!Number.isFinite(id)) return;
                          router.push(EDIT_ROUTE(id));
                        }}
                        disabled={!Number.isFinite(id)}
                      >
                        {t('edit')}
                      </Button>

                      <Button
                        onClick={() => {
                          if (!Number.isFinite(id)) return;
                          router.push(TRANSLATIONS_ROUTE(id));
                        }}
                        disabled={!Number.isFinite(id)}
                      >
                        {t('translations')}
                      </Button>

                      <Button
                        type="primary"
                        onClick={() => {
                          if (!Number.isFinite(id)) return;
                          onPublish(id);
                        }}
                        loading={
                          publishQuiz.isPending && publishingQuizId === id
                        }
                        disabled={
                          !Number.isFinite(id) ||
                          isPublishedWithoutDraft ||
                          (publishQuiz.isPending && publishingQuizId !== id)
                        }
                      >
                        {t('publish')}
                      </Button>

                      <Button
                        onClick={() => {
                          if (!Number.isFinite(id)) return;
                          onAnalytics(id, publishedId);
                        }}
                        disabled={!Number.isFinite(id) || !hasPublishedVersion}
                      >
                        {t('analytics')}
                      </Button>

                      <Button
                        danger
                        onClick={() => {
                          if (!Number.isFinite(id)) return;
                          setDeletingQuizId(id);
                        }}
                        loading={deleteQuiz.isPending && deletingQuizId === id}
                        disabled={!Number.isFinite(id)}
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {total > effectiveSize ? (
          <QuizzesPagination
            page={effectivePage}
            pageSize={effectiveSize}
            total={total}
            loading={quizzesQuery.isFetching}
            onChange={(p, ps) => {
              setPage(p);
              setSize(ps);
            }}
          />
        ) : null}
      </div>

      <Modal
        title={t('deleteConfirmTitle')}
        open={deletingQuizId !== null}
        onOk={async () => {
          const id = deletingQuizId;
          if (id === null) return;
          try {
            await deleteQuiz.mutateAsync({ id });
            const qk = getGetAllQueryKey();
            await qc.invalidateQueries({ queryKey: qk });
            await quizzesQuery.refetch();
            message.success(t('toastDeleted'));
          } catch (e) {
            message.error((e as Error).message);
          } finally {
            setDeletingQuizId(null);
          }
        }}
        onCancel={() => setDeletingQuizId(null)}
        okButtonProps={{ danger: true }}
      >
        <p>{t('deleteConfirmBody')}</p>
      </Modal>
    </div>
  );
}
