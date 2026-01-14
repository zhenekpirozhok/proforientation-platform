'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, Empty, Tag, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { useAdminQuizzes } from '@/entities/quiz/api/useAdminQuizzes';
import { useAdminPublishQuiz } from '@/entities/quiz/api/useAdminPublishQuiz';
import { getGetAllQueryKey } from '@/shared/api/generated/api';
import { QuizzesPagination } from '@/entities/quiz/ui/QuizzesPagination';

function toArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (!v || typeof v !== 'object') return [];
  const o = v as any;

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
  const o = v as any;

  const candidates = [o.total, o.totalElements, o.totalCount, o.count, o.meta?.total, o.page?.totalElements];

  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }

  return undefined;
}

function pickPage(v: unknown): number | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as any;

  const candidates = [o.page, o.pageNumber, o.number, o.meta?.page, o.page?.number];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }
  return undefined;
}

function pickSize(v: unknown): number | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as any;

  const candidates = [o.size, o.pageSize, o.meta?.size, o.page?.size];
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

function isPublished(q: any): boolean {
  const direct = q?.published === true || q?.isPublished === true || q?.status === 'PUBLISHED' || q?.state === 'PUBLISHED';
  if (direct) return true;

  const hasDate = typeof q?.publishedAt === 'string' || typeof q?.publishedAt === 'number' || q?.publishedAt instanceof Date;
  return Boolean(hasDate);
}

function formatDate(v: any): string | null {
  if (!v) return null;
  try {
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString();
  } catch {
    return null;
  }
}

const EDIT_ROUTE = (id: number) => `/admin/quizzes/${id}/edit`;
const ANALYTICS_ROUTE = (id: number) => `/admin/quizzes/${id}/analytics`;
const TRANSLATIONS_ROUTE = (id: number) => `/admin/quizzes/${id}/translations`;

export function AdminDashboardPage() {
  const t = useTranslations('AdminDashboard');
  const router = useRouter();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(12);

  const quizzesQuery = useAdminQuizzes({ page, size } as any);
  const publishQuiz = useAdminPublishQuiz();

  const data = quizzesQuery.data as any;
  const items = useMemo(() => toArray<any>(data), [data]);

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

  async function onPublish(id: number) {
    try {
      await publishQuiz.mutateAsync({ id } as any);
      await qc.invalidateQueries({ queryKey: getGetAllQueryKey() as any });
      await quizzesQuery.refetch();
      message.success(t('toastPublished'));
    } catch (e) {
      message.error((e as Error).message);
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

        <Button type="primary" onClick={() => router.push('/admin/quizzes/new')}>
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
              const title = safeStr(q?.title) || safeStr(q?.name) || `Quiz #${safeStr(q?.id)}`;
              const code = safeStr(q?.code);
              const published = isPublished(q);
              const createdAt = formatDate(q?.createdAt) ?? formatDate(q?.created) ?? null;
              const updatedAt = formatDate(q?.updatedAt) ?? formatDate(q?.updated) ?? null;
              const publishedAt = formatDate(q?.publishedAt) ?? null;

              return (
                <Card
                  key={q?.id ?? title}
                  className="!rounded-2xl"
                  title={
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{title}</div>
                        {code ? <div className="truncate text-xs text-slate-500 dark:text-slate-400">{code}</div> : null}
                      </div>

                      <Tag color={published ? 'green' : 'gold'}>{published ? t('published') : t('draft')}</Tag>
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
                        loading={publishQuiz.isPending}
                        disabled={!Number.isFinite(id) || published}
                      >
                        {t('publish')}
                      </Button>

                      <Button
                        onClick={() => {
                          if (!Number.isFinite(id)) return;
                          router.push(ANALYTICS_ROUTE(id));
                        }}
                        disabled={!Number.isFinite(id)}
                      >
                        {t('analytics')}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

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
      </div>
    </div>
  );
}
