'use client';

import { Tag } from 'antd';
import { useMemo } from 'react';
import { useSearchTranslations } from '@/entities/translation/api/useSearchTranslations';
import type { EntityType, FieldKey, LocaleKey, TranslationStatus } from '../model/types';

type TranslationDto = { field?: string; text?: string };

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

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function statusTag(status: TranslationStatus, label: string) {
  if (status === 'ok') return <Tag color="green">{label}</Tag>;
  if (status === 'partial') return <Tag color="gold">{label}</Tag>;
  return <Tag color="red">{label}</Tag>;
}

export function TranslationStatusCell(props: {
  entityType: EntityType;
  entityId: number;
  locale: LocaleKey;
  requiredFields: FieldKey[];
  t: (key: string) => string;
}) {
  const { entityType, entityId, locale, requiredFields, t } = props;

  const q = useSearchTranslations({ entityType, entityId, locale } as any);
  const data = (q as any)?.data;

  const status = useMemo<TranslationStatus>(() => {
    const items = toArray<TranslationDto>(data);
    const byField = new Map<string, string>();
    for (const it of items) {
      const f = safeString((it as any)?.field);
      const tx = safeString((it as any)?.text);
      if (f) byField.set(f, tx);
    }

    const present = requiredFields.filter((f) => (byField.get(f) ?? '').trim().length > 0).length;

    if (present === 0) return 'missing';
    if (present === requiredFields.length) return 'ok';
    return 'partial';
  }, [data, requiredFields]);

  return statusTag(status, t(`status_${status}`));
}
