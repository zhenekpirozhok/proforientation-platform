'use client';

import { Tag } from 'antd';
import { useMemo } from 'react';
import { useSearchTranslations } from '@/entities/translation/api/useSearchTranslations';
import type { EntityType, FieldKey, TranslationStatus } from '../model/types';

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

function safeString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

function statusTag(status: TranslationStatus, label: string) {
  if (status === 'ok') return <Tag color="green">{label}</Tag>;
  if (status === 'partial') return <Tag color="gold">{label}</Tag>;
  return <Tag color="red">{label}</Tag>;
}

function computeStatus(items: Record<string, unknown>[], requiredFields: FieldKey[]): TranslationStatus {
  if (!items || items.length === 0) return 'missing';
  const byField = new Map<string, string>();
  for (const it of items) {
    const field = safeString((it as Record<string, unknown>)?.field);
    const text = safeString((it as Record<string, unknown>)?.text);
    if (field) byField.set(field, text);
  }
  let okCount = 0;
  for (const f of requiredFields) {
    if ((byField.get(f) ?? '').trim()) okCount += 1;
  }
  if (okCount === 0) return 'missing';
  if (okCount === requiredFields.length) return 'ok';
  return 'partial';
}

export function RowStatusCell(props: {
  entityType: EntityType;
  entityId: number;
  locale: 'ru' | 'en';
  requiredFields: FieldKey[];
  t: (key: string) => string;
}) {
  const { entityType, entityId, locale, requiredFields, t } = props;

  // useSearchTranslations returns unknown, so we type it properly
  const q = useSearchTranslations({ entityType, entityId, locale });
  const data = (q as { data?: unknown })?.data;
  const items = useMemo(() => toArray<Record<string, unknown>>(data), [data]);

  const status = useMemo(() => computeStatus(items, requiredFields), [items, requiredFields]);

  return statusTag(status, t(`status_${status}`));
}
