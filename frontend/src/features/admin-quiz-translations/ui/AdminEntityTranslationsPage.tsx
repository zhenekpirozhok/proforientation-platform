'use client';

import {
  Button,
  Card,
  Divider,
  Modal,
  Segmented,
  Skeleton,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { useSearchTranslations } from '@/entities/translation/api/useSearchTranslations';
import { useCreateTranslation } from '@/entities/translation/api/useCreateTranslation';
import { useUpdateTranslation } from '@/entities/translation/api/useUpdateTranslation';

import type { SearchParams } from '@/shared/api/generated/model/searchParams';
import type { EntityConfig, FieldKey, LocaleKey } from '../model/types';
import { TranslationEditorForm, type FormState } from './TranslationEditorForm';

type TranslationDto = {
  id?: number;
  entityType?: string;
  entityId?: number;
  field?: string;
  locale?: string;
  text?: string;
};

function toArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (!v || typeof v !== 'object') return [];
  const o = v as Record<string, unknown>;
  if (Array.isArray(o.items as unknown)) return o.items as T[];
  if (Array.isArray(o.results as unknown)) return o.results as T[];
  if (Array.isArray(o.rows as unknown)) return o.rows as T[];
  if (Array.isArray(o.content as unknown)) return o.content as T[];
  if ((o.data as unknown) !== undefined) return toArray<T>(o.data as unknown);
  if ((o.result as unknown) !== undefined)
    return toArray<T>(o.result as unknown);
  if ((o.payload as unknown) !== undefined)
    return toArray<T>(o.payload as unknown);
  return [];
}

function setArrayBack(original: unknown, nextArr: unknown[]): unknown {
  if (Array.isArray(original)) return nextArr;

  if (original && typeof original === 'object') {
    const o = original as Record<string, unknown>;
    if (Array.isArray(o.items as unknown)) return { ...o, items: nextArr };
    if (Array.isArray(o.results as unknown)) return { ...o, results: nextArr };
    if (Array.isArray(o.rows as unknown)) return { ...o, rows: nextArr };
    if (Array.isArray(o.content as unknown)) return { ...o, content: nextArr };
    if ((o.data as unknown) !== undefined)
      return { ...o, data: setArrayBack(o.data, nextArr) };
    if ((o.result as unknown) !== undefined)
      return { ...o, result: setArrayBack(o.result, nextArr) };
    if ((o.payload as unknown) !== undefined)
      return { ...o, payload: setArrayBack(o.payload, nextArr) };
    return { ...o, items: nextArr };
  }

  return nextArr;
}

function toNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function pickField(r: unknown): string {
  return safeString((r as Record<string, unknown>)?.field);
}

function pickText(r: unknown): string {
  return safeString((r as Record<string, unknown>)?.text);
}

function emptyForm(): FormState {
  return { title: '', text: '', description: '' };
}

function normalizeForm(s: FormState): FormState {
  return {
    title: s.title ?? '',
    text: s.text ?? '',
    description: s.description ?? '',
  };
}

function isDirty(a: FormState, b: FormState, fields: FieldKey[]) {
  const x = normalizeForm(a);
  const y = normalizeForm(b);
  for (const f of fields) {
    if ((x[f] ?? '') !== (y[f] ?? '')) return true;
  }
  return false;
}

export function AdminEntityTranslationsPage(props: {
  entityId: number;
  config: EntityConfig;
  backHref?: string;
  titleKey?: string;
  defaults?: Partial<FormState>;
}) {
  const { entityId, config, backHref, titleKey, defaults } = props;

  const t = useTranslations('AdminTranslations');
  const router = useRouter();
  const qc = useQueryClient();

  const createTranslation = useCreateTranslation();
  const updateTranslation = useUpdateTranslation();

  const canLoad = Number.isFinite(entityId) && entityId > 0;

  const ruParams = useMemo<SearchParams | undefined>(() => {
    if (!canLoad) return undefined;
    return {
      entityType: config.entityType,
      entityId,
      locale: 'ru',
    } as SearchParams;
  }, [canLoad, config.entityType, entityId]);

  const enParams = useMemo<SearchParams | undefined>(() => {
    if (!canLoad) return undefined;
    return {
      entityType: config.entityType,
      entityId,
      locale: 'en',
    } as SearchParams;
  }, [canLoad, config.entityType, entityId]);

  const ruQuery = useSearchTranslations(ruParams);
  const enQuery = useSearchTranslations(enParams);

  const ruData = (ruQuery as unknown as { data?: unknown })?.data;
  const enData = (enQuery as unknown as { data?: unknown })?.data;

  const ruItems = useMemo(() => toArray<TranslationDto>(ruData), [ruData]);
  const enItems = useMemo(() => toArray<TranslationDto>(enData), [enData]);

  const ruByField = useMemo(() => {
    const m = new Map<string, TranslationDto>();
    for (const r of ruItems) {
      const f = pickField(r);
      if (f) m.set(f, r);
    }
    return m;
  }, [ruItems]);

  const enByField = useMemo(() => {
    const m = new Map<string, TranslationDto>();
    for (const r of enItems) {
      const f = pickField(r);
      if (f) m.set(f, r);
    }
    return m;
  }, [enItems]);

  const fields = useMemo(
    () => config.fields.map((x) => x.key),
    [config.fields],
  );

  const defaultsNorm = useMemo<FormState>(() => {
    return normalizeForm({ ...emptyForm(), ...(defaults ?? {}) });
  }, [defaults]);

  const ruInitial = useMemo<FormState>(() => {
    const s = emptyForm();
    for (const f of fields)
      s[f] = pickText(ruByField.get(f)) || (defaultsNorm[f] ?? '');
    return normalizeForm(s);
  }, [fields, ruByField, defaultsNorm]);

  const enInitial = useMemo<FormState>(() => {
    const s = emptyForm();
    for (const f of fields)
      s[f] = pickText(enByField.get(f)) || (defaultsNorm[f] ?? '');
    return normalizeForm(s);
  }, [fields, enByField, defaultsNorm]);

  const [activeLocale, setActiveLocale] = useState<LocaleKey>('ru');
  const [splitView, setSplitView] = useState(false);

  const [ruForm, setRuForm] = useState<FormState>(emptyForm());
  const [enForm, setEnForm] = useState<FormState>(emptyForm());

  const [ruSaved, setRuSaved] = useState<FormState>(emptyForm());
  const [enSaved, setEnSaved] = useState<FormState>(emptyForm());

  const [savingLocale, setSavingLocale] = useState<LocaleKey | 'all' | null>(
    null,
  );
  const savingLocaleRef = useRef<LocaleKey | 'all' | null>(null);

  const ruIsSuccess =
    (ruQuery as { isSuccess?: boolean } | undefined)?.isSuccess === true;
  const enIsSuccess =
    (enQuery as { isSuccess?: boolean } | undefined)?.isSuccess === true;

  useEffect(() => {
    if (!ruIsSuccess) return;
    setRuForm(ruInitial);
    setRuSaved(ruInitial);
  }, [ruIsSuccess, ruInitial]);

  useEffect(() => {
    if (!enIsSuccess) return;
    setEnForm(enInitial);
    setEnSaved(enInitial);
  }, [enIsSuccess, enInitial]);

  const isLoading =
    (ruQuery as unknown as { isLoading?: boolean })?.isLoading ||
    (enQuery as unknown as { isLoading?: boolean })?.isLoading;

  const isSaving = createTranslation.isPending || updateTranslation.isPending;

  const dirtyRu = useMemo(
    () => isDirty(ruForm, ruSaved, fields),
    [ruForm, ruSaved, fields],
  );
  const dirtyEn = useMemo(
    () => isDirty(enForm, enSaved, fields),
    [enForm, enSaved, fields],
  );
  const anyDirty = dirtyRu || dirtyEn;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!anyDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [anyDirty]);

  function upsertCache(
    locale: LocaleKey,
    field: FieldKey,
    text: string,
    idMaybe?: number,
  ) {
    const query =
      locale === 'ru'
        ? (ruQuery as unknown as { queryKey?: unknown })
        : (enQuery as unknown as { queryKey?: unknown });

    const qk = query?.queryKey as unknown[] | undefined;
    if (!qk) return;

    qc.setQueryData(qk, (prev: unknown) => {
      const arr = toArray<Record<string, unknown>>(prev);
      const nextArr = [...arr];
      const idx = nextArr.findIndex(
        (x) => safeString((x as Record<string, unknown>)?.field) === field,
      );

      if (idx >= 0) {
        const cur = nextArr[idx] ?? {};
        nextArr[idx] = {
          ...cur,
          id:
            typeof idMaybe === 'number'
              ? idMaybe
              : (cur as Record<string, unknown>)?.id,
          entityType: config.entityType,
          entityId,
          locale,
          field,
          text,
        } as Record<string, unknown>;
      } else {
        nextArr.push({
          id: idMaybe,
          entityType: config.entityType,
          entityId,
          locale,
          field,
          text,
        } as Record<string, unknown>);
      }

      return setArrayBack(prev, nextArr);
    });
  }

  async function upsertField(locale: LocaleKey, field: FieldKey, text: string) {
    const byField = locale === 'ru' ? ruByField : enByField;
    const existing = byField.get(field) as TranslationDto | undefined;
    const id = toNumber(existing?.id);

    if (typeof id === 'number') {
      upsertCache(locale, field, text, id);
      await updateTranslation.mutateAsync({ id, data: { text } });
      return;
    }

    upsertCache(locale, field, text, undefined);

    const created: unknown = await createTranslation.mutateAsync({
      data: {
        entityType: config.entityType,
        entityId,
        field,
        locale,
        text,
      },
    });

    const createdRec = created as Record<string, unknown> | undefined;
    const createdId = toNumber(
      createdRec?.id ??
        (createdRec?.data as Record<string, unknown> | undefined)?.id ??
        (createdRec?.result as Record<string, unknown> | undefined)?.id,
    );

    if (typeof createdId === 'number')
      upsertCache(locale, field, text, createdId);
  }

  async function saveLocale(locale: LocaleKey) {
    const f = locale === 'ru' ? ruForm : enForm;
    const localeDirty = locale === 'ru' ? dirtyRu : dirtyEn;

    if (!localeDirty) {
      message.success(t('nothingToSave'));
      return;
    }

    try {
      savingLocaleRef.current = locale;
      setSavingLocale(locale);

      for (const field of fields) {
        const val = (f[field] ?? '').trim();
        await upsertField(locale, field, val);
      }

      const nextSaved = normalizeForm(f);
      if (locale === 'ru') setRuSaved(nextSaved);
      else setEnSaved(nextSaved);

      message.success(
        locale === 'ru' ? t('saveSuccessRu') : t('saveSuccessEn'),
      );
    } catch (e) {
      message.error((e as Error).message);
      try {
        if (locale === 'ru')
          await (ruQuery as { refetch?: () => Promise<unknown> }).refetch?.();
        else
          await (enQuery as { refetch?: () => Promise<unknown> }).refetch?.();
      } catch {}
    } finally {
      savingLocaleRef.current = null;
      setSavingLocale(null);
    }
  }

  async function saveAll() {
    const toSave: LocaleKey[] = [];
    if (dirtyRu) toSave.push('ru');
    if (dirtyEn) toSave.push('en');

    if (toSave.length === 0) {
      message.success(t('nothingToSave'));
      return;
    }

    try {
      savingLocaleRef.current = 'all';
      setSavingLocale('all');

      for (const loc of toSave) {
        await saveLocale(loc);
      }
    } finally {
      savingLocaleRef.current = null;
      setSavingLocale(null);
    }
  }

  function confirmNavigate(fn: () => void) {
    if (!anyDirty) {
      fn();
      return;
    }

    Modal.confirm({
      title: t('discardTitle'),
      content: t('discardText'),
      okText: t('discardOk'),
      cancelText: t('discardCancel'),
      onOk: fn,
    });
  }

  const headerTitle = titleKey
    ? t(titleKey)
    : t('pageTitle', { entityType: config.entityType });

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <Typography.Title
            level={2}
            className="!m-0 !text-2xl sm:!text-3xl break-normal whitespace-normal"
            style={{ wordBreak: 'normal', overflowWrap: 'normal' }}
          >
            {headerTitle}
          </Typography.Title>

          <Typography.Text type="secondary" className="block">
            {t('entityId', { id: entityId })}
          </Typography.Text>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <Button
            className="w-full sm:w-auto"
            onClick={() =>
              confirmNavigate(() =>
                backHref ? router.push(backHref) : router.back(),
              )
            }
          >
            {t('back')}
          </Button>

          <Button
            type="primary"
            className="w-full sm:w-auto"
            onClick={saveAll}
            loading={savingLocale === 'all'}
            disabled={!canLoad || isLoading || isSaving || !anyDirty}
          >
            {t('saveAll')}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Segmented
              value={activeLocale}
              onChange={(v) => setActiveLocale(v as LocaleKey)}
              options={[
                { label: 'RU', value: 'ru' },
                { label: 'EN', value: 'en' },
              ]}
              disabled={!canLoad || isLoading || isSaving}
            />
            {activeLocale === 'ru' && dirtyRu ? (
              <Tag color="gold" className="m-0">
                {t('unsaved')}
              </Tag>
            ) : null}
            {activeLocale === 'en' && dirtyEn ? (
              <Tag color="gold" className="m-0">
                {t('unsaved')}
              </Tag>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Typography.Text type="secondary">{t('splitView')}</Typography.Text>
            <Switch
              checked={splitView}
              onChange={setSplitView}
              disabled={!canLoad || isLoading || isSaving}
            />
          </div>
        </div>

        {isLoading ? (
          <Card className="!rounded-2xl" bodyStyle={{ padding: 16 }}>
            <Skeleton active title paragraph={{ rows: 7 }} />
          </Card>
        ) : splitView ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TranslationEditorForm
              locale="ru"
              title={t('editorTitle', { locale: 'RU' })}
              config={config}
              form={ruForm}
              saved={ruSaved}
              disabled={!canLoad || isLoading || isSaving}
              saving={savingLocale === 'all' || savingLocale === 'ru'}
              onChange={setRuForm}
              onSave={() => saveLocale('ru')}
              t={t}
            />
            <TranslationEditorForm
              locale="en"
              title={t('editorTitle', { locale: 'EN' })}
              config={config}
              form={enForm}
              saved={enSaved}
              disabled={!canLoad || isLoading || isSaving}
              saving={savingLocale === 'all' || savingLocale === 'en'}
              onChange={setEnForm}
              onSave={() => saveLocale('en')}
              t={t}
            />
          </div>
        ) : (
          <TranslationEditorForm
            locale={activeLocale}
            title={t('editorTitle', { locale: activeLocale.toUpperCase() })}
            config={config}
            form={activeLocale === 'ru' ? ruForm : enForm}
            saved={activeLocale === 'ru' ? ruSaved : enSaved}
            disabled={!canLoad || isLoading || isSaving}
            saving={savingLocale === 'all' || savingLocale === activeLocale}
            onChange={activeLocale === 'ru' ? setRuForm : setEnForm}
            onSave={() => saveLocale(activeLocale)}
            t={t}
          />
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card
            className="!rounded-2xl"
            bodyStyle={{ padding: 16 }}
            title={t('currentBackendRu')}
          >
            <div className="flex flex-col gap-2 text-sm">
              {fields.map((f) => (
                <div key={`ru-${f}`}>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t(`field_${f}`)}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {(ruSaved[f] ?? '') || '—'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            className="!rounded-2xl"
            bodyStyle={{ padding: 16 }}
            title={t('currentBackendEn')}
          >
            <div className="flex flex-col gap-2 text-sm">
              {fields.map((f) => (
                <div key={`en-${f}`}>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t(`field_${f}`)}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {(enSaved[f] ?? '') || '—'}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div>
            {dirtyRu ? `RU: ${t('unsaved')}` : `RU: ${t('saved')}`} •{' '}
            {dirtyEn ? `EN: ${t('unsaved')}` : `EN: ${t('saved')}`}
          </div>
          <div>{t('hint')}</div>
        </div>

        <div className="sm:hidden sticky bottom-3 mt-3">
          <Card className="!rounded-2xl" bodyStyle={{ padding: 12 }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {dirtyRu ? `RU ${t('unsaved')}` : `RU ${t('saved')}`}
                </span>
                <Divider type="vertical" className="!h-4" />
                <span>
                  {dirtyEn ? `EN ${t('unsaved')}` : `EN ${t('saved')}`}
                </span>
              </div>

              <Button
                type="primary"
                onClick={() => saveLocale(activeLocale)}
                loading={
                  savingLocale === 'all' || savingLocale === activeLocale
                }
                disabled={
                  !canLoad ||
                  isLoading ||
                  isSaving ||
                  !(activeLocale === 'ru' ? dirtyRu : dirtyEn)
                }
              >
                {t('save')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
