'use client';

import {
  Button,
  Card,
  Input,
  Modal,
  Segmented,
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

type LocaleKey = 'ru' | 'en';

type TranslationDto = {
  id?: number;
  entityType?: string;
  entityId?: number;
  field?: string;
  locale?: string;
  text?: string;
};

type FormState = {
  title: string;
  descriptionDefault: string;
};

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

function setArrayBack(original: unknown, nextArr: unknown[]): unknown {
  if (Array.isArray(original)) return nextArr;

  if (original && typeof original === 'object') {
    const o = original as Record<string, unknown>;

    if (Array.isArray(o.items)) return { ...o, items: nextArr };
    if (Array.isArray(o.results)) return { ...o, results: nextArr };
    if (Array.isArray(o.rows)) return { ...o, rows: nextArr };
    if (Array.isArray(o.content)) return { ...o, content: nextArr };

    if (o.data !== undefined)
      return { ...o, data: setArrayBack(o.data, nextArr) };
    if (o.result !== undefined)
      return { ...o, result: setArrayBack(o.result, nextArr) };
    if (o.payload !== undefined)
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

function normalizeForm(f: FormState): FormState {
  return {
    title: f.title ?? '',
    descriptionDefault: f.descriptionDefault ?? '',
  };
}

const ENTITY_TYPE = 'QUIZ';
const FIELD_TITLE = 'title';
const FIELD_DESCRIPTION = 'descriptionDefault';

export function AdminQuizTranslationsPage({ quizId }: { quizId: number }) {
  const t = useTranslations('AdminQuizTranslations');
  const router = useRouter();
  const qc = useQueryClient();

  const createTranslation = useCreateTranslation();
  const updateTranslation = useUpdateTranslation();

  const canLoad = Number.isFinite(quizId) && quizId > 0;

  const ruQuery = useSearchTranslations(
    canLoad
      ? { entityType: ENTITY_TYPE, entityId: quizId, locale: 'ru' }
      : undefined,
  );

  const enQuery = useSearchTranslations(
    canLoad
      ? { entityType: ENTITY_TYPE, entityId: quizId, locale: 'en' }
      : undefined,
  );

  const ruData = (ruQuery as unknown as { data?: unknown })?.data;
  const enData = (enQuery as unknown as { data?: unknown })?.data;

  const ruItems = useMemo(() => toArray<TranslationDto>(ruData), [ruData]);
  const enItems = useMemo(() => toArray<TranslationDto>(enData), [enData]);

  const ruByField = useMemo(() => {
    const m = new Map<string, TranslationDto>();
    for (const r of ruItems as TranslationDto[]) {
      const f = pickField(r);
      if (f) m.set(f, r);
    }
    return m;
  }, [ruItems]);

  const enByField = useMemo(() => {
    const m = new Map<string, TranslationDto>();
    for (const r of enItems as TranslationDto[]) {
      const f = pickField(r);
      if (f) m.set(f, r);
    }
    return m;
  }, [enItems]);

  const ruInitial = useMemo<FormState>(() => {
    const title = pickText(ruByField.get(FIELD_TITLE));
    const descriptionDefault = pickText(ruByField.get(FIELD_DESCRIPTION));
    return normalizeForm({ title, descriptionDefault });
  }, [ruByField]);

  const enInitial = useMemo<FormState>(() => {
    const title = pickText(enByField.get(FIELD_TITLE));
    const descriptionDefault = pickText(enByField.get(FIELD_DESCRIPTION));
    return normalizeForm({ title, descriptionDefault });
  }, [enByField]);

  const [activeLocale, setActiveLocale] = useState<LocaleKey>('ru');

  const [ruForm, setRuForm] = useState<FormState>({
    title: '',
    descriptionDefault: '',
  });
  const [enForm, setEnForm] = useState<FormState>({
    title: '',
    descriptionDefault: '',
  });

  const [ruSaved, setRuSaved] = useState<FormState>({
    title: '',
    descriptionDefault: '',
  });
  const [enSaved, setEnSaved] = useState<FormState>({
    title: '',
    descriptionDefault: '',
  });

  const savingLocaleRef = useRef<LocaleKey | 'all' | null>(null);
  const [savingLocale, setSavingLocale] = useState<LocaleKey | 'all' | null>(
    null,
  );

  const ruIsSuccess =
    (ruQuery as { isSuccess?: boolean } | undefined)?.isSuccess === true;
  const enIsSuccess =
    (enQuery as { isSuccess?: boolean } | undefined)?.isSuccess === true;

  useEffect(() => {
    if (ruIsSuccess) {
      setRuForm(ruInitial);
      setRuSaved(ruInitial);
    }
  }, [ruIsSuccess, ruInitial]);

  useEffect(() => {
    if (enIsSuccess) {
      setEnForm(enInitial);
      setEnSaved(enInitial);
    }
  }, [enIsSuccess, enInitial]);

  const activeForm = activeLocale === 'ru' ? ruForm : enForm;
  const setActiveForm = (next: FormState) =>
    activeLocale === 'ru' ? setRuForm(next) : setEnForm(next);

  const isLoading =
    (ruQuery as unknown as { isLoading?: boolean })?.isLoading ||
    (enQuery as unknown as { isLoading?: boolean })?.isLoading;
  const isSaving = createTranslation.isPending || updateTranslation.isPending;

  const dirtyRu = useMemo(() => {
    const a = normalizeForm(ruForm);
    const b = normalizeForm(ruSaved);
    return a.title !== b.title || a.descriptionDefault !== b.descriptionDefault;
  }, [ruForm, ruSaved]);

  const dirtyEn = useMemo(() => {
    const a = normalizeForm(enForm);
    const b = normalizeForm(enSaved);
    return a.title !== b.title || a.descriptionDefault !== b.descriptionDefault;
  }, [enForm, enSaved]);

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
    field: string,
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
      const idx = nextArr.findIndex((x) => pickField(x) === field);

      if (idx >= 0) {
        const cur = nextArr[idx] ?? {};
        nextArr[idx] = {
          ...cur,
          id:
            typeof idMaybe === 'number'
              ? idMaybe
              : (cur as Record<string, unknown>)?.id,
          entityType: ENTITY_TYPE,
          entityId: quizId,
          locale,
          field,
          text,
        } as Record<string, unknown>;
      } else {
        nextArr.push({
          id: idMaybe,
          entityType: ENTITY_TYPE,
          entityId: quizId,
          locale,
          field,
          text,
        } as Record<string, unknown>);
      }

      return setArrayBack(prev, nextArr) as unknown;
    });
  }

  async function upsertField(locale: LocaleKey, field: string, text: string) {
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
        entityType: ENTITY_TYPE,
        entityId: quizId,
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

    const title = (f.title ?? '').trim();
    const descriptionDefault = (f.descriptionDefault ?? '').trim();

    if (!title) {
      message.error(t('titleRequired'));
      return;
    }

    const isDirty = locale === 'ru' ? dirtyRu : dirtyEn;
    if (!isDirty) {
      message.success(t('nothingToSave'));
      return;
    }

    try {
      savingLocaleRef.current = locale;
      setSavingLocale(locale);

      await upsertField(locale, FIELD_TITLE, title);
      await upsertField(locale, FIELD_DESCRIPTION, descriptionDefault);

      if (locale === 'ru')
        setRuSaved(normalizeForm({ title, descriptionDefault }));
      else setEnSaved(normalizeForm({ title, descriptionDefault }));

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
      } catch {
        // ignore refetch errors
      }
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

  const showUnsavedTagRu = dirtyRu;
  const showUnsavedTagEn = dirtyEn;

  const activeDirty = activeLocale === 'ru' ? dirtyRu : dirtyEn;

  const activeSaving =
    savingLocale === 'all' ? true : savingLocale === activeLocale;

  const activeCanSave = canLoad && !isLoading && !isSaving && activeDirty;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Typography.Title level={2} className="!m-0">
            {t('title')}
          </Typography.Title>
          <Typography.Text type="secondary" className="block">
            {t('quizId', { id: quizId })}
          </Typography.Text>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => confirmNavigate(() => router.back())}>
            {t('back')}
          </Button>

          <Button
            type="primary"
            onClick={saveAll}
            loading={savingLocale === 'all'}
            disabled={!canLoad || isLoading || isSaving || !anyDirty}
          >
            {t('saveAll')}
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Card className="!rounded-2xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
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

                {activeLocale === 'ru' && showUnsavedTagRu ? (
                  <Tag color="gold">{t('unsaved')}</Tag>
                ) : null}

                {activeLocale === 'en' && showUnsavedTagEn ? (
                  <Tag color="gold">{t('unsaved')}</Tag>
                ) : null}
              </div>

              <Button
                type="primary"
                onClick={() => saveLocale(activeLocale)}
                loading={activeSaving}
                disabled={!activeCanSave}
              >
                {t('saveLocale', { locale: activeLocale.toUpperCase() })}
              </Button>
            </div>

            <div>
              <Typography.Text className="block">
                {t('titleLabel')}
              </Typography.Text>
              <Input
                value={activeForm.title}
                onChange={(e) =>
                  setActiveForm({ ...activeForm, title: e.target.value })
                }
                size="large"
                placeholder={
                  activeLocale === 'ru'
                    ? t('placeholderTitleRu')
                    : t('placeholderTitleEn')
                }
                disabled={isLoading || isSaving || !canLoad}
                status={!activeForm.title.trim() && activeDirty ? 'error' : ''}
              />
            </div>

            <div>
              <Typography.Text className="block">
                {t('descriptionLabel')}
              </Typography.Text>
              <Input.TextArea
                value={activeForm.descriptionDefault}
                onChange={(e) =>
                  setActiveForm({
                    ...activeForm,
                    descriptionDefault: e.target.value,
                  })
                }
                placeholder={
                  activeLocale === 'ru'
                    ? t('placeholderDescRu')
                    : t('placeholderDescEn')
                }
                autoSize={{ minRows: 4, maxRows: 10 }}
                disabled={isLoading || isSaving || !canLoad}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card
                size="small"
                className="!rounded-2xl"
                title={t('currentBackendRu')}
              >
                <div className="text-sm">
                  <div className="font-medium">{ruSaved.title || '—'}</div>
                  <div className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                    {ruSaved.descriptionDefault || '—'}
                  </div>
                </div>
              </Card>

              <Card
                size="small"
                className="!rounded-2xl"
                title={t('currentBackendEn')}
              >
                <div className="text-sm">
                  <div className="font-medium">{enSaved.title || '—'}</div>
                  <div className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                    {enSaved.descriptionDefault || '—'}
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div>
                {showUnsavedTagRu ? `RU: ${t('unsaved')}` : `RU: ${t('saved')}`}{' '}
                •{' '}
                {showUnsavedTagEn ? `EN: ${t('unsaved')}` : `EN: ${t('saved')}`}
              </div>
              <div>{t('hint')}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Button
          type="link"
          onClick={() =>
            confirmNavigate(() => router.push(`/admin/quizzes/${quizId}`))
          }
          disabled={!canLoad}
        >
          {t('backToQuiz')}
        </Button>
      </div>
    </div>
  );
}
