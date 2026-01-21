'use client';

import { Button, Card, Grid, Input, List, Space, Table, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import type { EntityType, FieldKey, QuizTranslatableRow } from '../model/types';
import { TranslationStatusCell } from './TranslationStatusCell';

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
  t: (key: string, values?: Record<string, string | number | Date> | undefined) => string;
}) {
  const { title, rows, isLoading, entityType, requiredFields, t } = props;

  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const [q, setQ] = useState('');

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
          <TranslationStatusCell
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
          <TranslationStatusCell
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Typography.Title level={3} className="!m-0">
          {title}
        </Typography.Title>

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="sm:max-w-sm"
          allowClear
        />
      </div>

      {isMobile ? (
        <Card className="!rounded-2xl" bodyStyle={{ padding: 12 }}>
          <List
            loading={!!isLoading}
            dataSource={filtered}
            renderItem={(r) => (
              <List.Item
                className="!px-0"
                actions={[
                  <Link key="open" href={r.href}>
                    <Button type="primary" size="small">
                      {t('open')}
                    </Button>
                  </Link>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{r.title}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">#{r.id}</span>
                    </div>
                  }
                  description={
                    <div className="flex flex-col gap-2">
                      {r.subtitle ? (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {r.subtitle}
                        </div>
                      ) : null}
                      <Space size={8} wrap>
                        <TranslationStatusCell
                          entityType={entityType}
                          entityId={r.id}
                          locale="ru"
                          requiredFields={requiredFields}
                          t={(k) => t(k)}
                        />
                        <TranslationStatusCell
                          entityType={entityType}
                          entityId={r.id}
                          locale="en"
                          requiredFields={requiredFields}
                          t={(k) => t(k)}
                        />
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ) : (
        <Card className="!rounded-2xl" bodyStyle={{ padding: 0 }}>
            <Table
            loading={!!isLoading}
            rowKey="id"
            columns={columns as ColumnsType<QuizTranslatableRow>}
            dataSource={filtered}
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        </Card>
      )}
    </div>
  );
}
