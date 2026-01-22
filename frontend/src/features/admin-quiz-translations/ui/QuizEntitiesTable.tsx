'use client';

import { Button, Card, Input, List, Table, Typography, Grid } from 'antd';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import type { QuizTranslatableRow, EntityType, FieldKey } from '../model/types';
import { RowStatusCell } from './RowStatusCell';

const { useBreakpoint } = Grid;

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function QuizEntitiesTable(props: {
  title: string;
  rows: QuizTranslatableRow[];
  isLoading?: boolean;
  entityType: EntityType;
  requiredFields: FieldKey[];
  t: (key: string, values?: Record<string, unknown>) => string;
}) {
  const { title, rows, isLoading, entityType, requiredFields, t } = props;

  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const [q, setQ] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  const filtered = useMemo(() => {
    const nq = norm(q);
    if (!nq) return rows;
    return rows.filter((r) => {
      const a = norm(String(r.id));
      const b = norm(r.title ?? '');
      const c = norm(r.subtitle ?? '');
      return a.includes(nq) || b.includes(nq) || c.includes(nq);
    });
  }, [rows, q]);

  useEffect(() => {
    // reset visible count when filter or viewport changes
    // Avoid calling setState directly in effect body to prevent cascading renders
    setTimeout(() => setVisibleCount(10), 0);
  }, [q, isMobile]);

  const columns = useMemo(
    () => [
      { title: t('colId'), dataIndex: 'id', key: 'id', width: 90 },
      {
        title: t('colTitle'),
        dataIndex: 'title',
        key: 'title',
        render: (_: unknown, r: QuizTranslatableRow) => (
          <div className="min-w-0">
            <div className="font-medium truncate">{r.title}</div>
            {r.subtitle ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {r.subtitle}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: 'RU',
        key: 'ru',
        width: 120,
        render: (_: unknown, r: QuizTranslatableRow) => (
          <RowStatusCell
            entityType={entityType}
            entityId={r.id}
            locale="ru"
            requiredFields={requiredFields}
            t={(k) => t(k)}
          />
        ),
      },
      {
        title: 'EN',
        key: 'en',
        width: 120,
        render: (_: unknown, r: QuizTranslatableRow) => (
          <RowStatusCell
            entityType={entityType}
            entityId={r.id}
            locale="en"
            requiredFields={requiredFields}
            t={(k) => t(k)}
          />
        ),
      },
      {
        title: t('colActions'),
        key: 'actions',
        width: 140,
        render: (_: unknown, r: QuizTranslatableRow) => (
          <Link href={r.href}>
            <Button type="primary">{t('open')}</Button>
          </Link>
        ),
      },
    ],
    [t, entityType, requiredFields],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Typography.Title
          level={3}
          className="!m-0 text-xl leading-tight break-words sm:!text-2xl"
        >
          {title}
        </Typography.Title>

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full"
          allowClear
        />
      </div>

      {isMobile ? (
        <Card className="!rounded-2xl" bodyStyle={{ padding: 12 }}>
          <List
            loading={!!isLoading}
            dataSource={filtered.slice(0, visibleCount)}
            renderItem={(r) => (
              <List.Item className="!px-0">
                <div className="flex w-full min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium leading-snug break-words">
                      {r.title}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>ID: {r.id}</span>
                      {r.subtitle ? (
                        <span className="truncate">{r.subtitle}</span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <RowStatusCell
                        entityType={entityType}
                        entityId={r.id}
                        locale="ru"
                        requiredFields={requiredFields}
                        t={(k) => t(k)}
                      />
                      <RowStatusCell
                        entityType={entityType}
                        entityId={r.id}
                        locale="en"
                        requiredFields={requiredFields}
                        t={(k) => t(k)}
                      />
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link href={r.href}>
                      <Button
                        type="primary"
                        size="small"
                        className="min-w-[64px]"
                      >
                        {t('open')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </List.Item>
            )}
            footer={
              filtered.length > visibleCount ? (
                <div className="w-full flex justify-center">
                  <Button onClick={() => setVisibleCount((v) => v + 10)}>
                    {t('loadMore')}
                  </Button>
                </div>
              ) : null
            }
          />
        </Card>
      ) : (
        <Card className="!rounded-2xl" bodyStyle={{ padding: 0 }}>
          <div className="overflow-x-auto">
            <Table
              loading={!!isLoading}
              rowKey="id"
              columns={columns}
              dataSource={filtered}
              pagination={{ pageSize: 10 }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
