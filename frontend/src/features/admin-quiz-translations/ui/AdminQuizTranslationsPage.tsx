'use client';

import { Button, Card, Input, Segmented, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAdminUpdateQuiz } from '@/entities/quiz/api/useAdminUpdateQuiz';
import { parseResponse } from '@/shared/api/parseResponse';
import { getGetById1QueryKey, getGetAll1QueryKey } from '@/shared/api/generated/api';

type LocaleKey = 'ru' | 'en';

type FormState = {
  title: string;
  description: string;
};

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

async function fetchQuizLocalized(params: { quizId: number; locale: LocaleKey; signal?: AbortSignal }) {
  const { quizId, locale, signal } = params;

  const res = await fetch(`/api/quizzes/${quizId}`, {
    method: 'GET',
    headers: { 'x-locale': locale },
    signal,
  });

  return parseResponse<any>(res);
}

function quizTranslationsKey(quizId: number, locale: LocaleKey) {
  return ['admin', 'quiz', quizId, 'translations', locale] as const;
}

export function AdminQuizTranslationsPage({ quizId }: { quizId: number }) {
  const t = useTranslations('AdminQuizTranslations');
  const router = useRouter();
  const qc = useQueryClient();
  const updateQuiz = useAdminUpdateQuiz();

  const [activeLocale, setActiveLocale] = useState<LocaleKey>('ru');

  const ruQuery = useQuery({
    queryKey: quizTranslationsKey(quizId, 'ru'),
    queryFn: ({ signal }) => fetchQuizLocalized({ quizId, locale: 'ru', signal }),
    enabled: Number.isFinite(quizId) && quizId > 0,
    refetchOnWindowFocus: false,
  });

  const enQuery = useQuery({
    queryKey: quizTranslationsKey(quizId, 'en'),
    queryFn: ({ signal }) => fetchQuizLocalized({ quizId, locale: 'en', signal }),
    enabled: Number.isFinite(quizId) && quizId > 0,
    refetchOnWindowFocus: false,
  });

  const ruInitial = useMemo<FormState>(() => {
    const d = ruQuery.data as any;
    return {
      title: safeString(d?.title),
      description: safeString(d?.descriptionDefault ?? d?.description),
    };
  }, [ruQuery.data]);

  const enInitial = useMemo<FormState>(() => {
    const d = enQuery.data as any;
    return {
      title: safeString(d?.title),
      description: safeString(d?.descriptionDefault ?? d?.description),
    };
  }, [enQuery.data]);

  const [ruForm, setRuForm] = useState<FormState>({ title: '', description: '' });
  const [enForm, setEnForm] = useState<FormState>({ title: '', description: '' });

  const readyRu = ruQuery.isSuccess;
  const readyEn = enQuery.isSuccess;

  useMemo(() => {
    if (readyRu) setRuForm(ruInitial);
    return null;
  }, [readyRu, ruInitial.title, ruInitial.description]);

  useMemo(() => {
    if (readyEn) setEnForm(enInitial);
    return null;
  }, [readyEn, enInitial.title, enInitial.description]);

  const activeForm = activeLocale === 'ru' ? ruForm : enForm;
  const setActiveForm = (next: FormState) => (activeLocale === 'ru' ? setRuForm(next) : setEnForm(next));

  const isLoading = ruQuery.isLoading || enQuery.isLoading;
  const isSaving = updateQuiz.isPending;

  async function saveLocale(locale: LocaleKey) {
    const f = locale === 'ru' ? ruForm : enForm;

    const title = f.title.trim();
    const descriptionDefault = f.description.trim();

    if (!title) {
      message.error(t('titleRequired'));
      return;
    }

    try {
      await updateQuiz.mutateAsync({
        id: quizId as any,
        data: { title, descriptionDefault } as any,
        headers: { 'x-locale': locale } as any,
      } as any);

      await qc.invalidateQueries({ queryKey: getGetAll1QueryKey() as any });
      await qc.invalidateQueries({ queryKey: getGetById1QueryKey(quizId as any) as any });
      await qc.invalidateQueries({ queryKey: quizTranslationsKey(quizId, locale) as any });

      message.success(locale === 'ru' ? t('saveSuccessRu') : t('saveSuccessEn'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  async function saveAll() {
    await saveLocale('ru');
    await saveLocale('en');
  }

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
          <Button onClick={() => router.back()}>{t('back')}</Button>
          <Button type="primary" onClick={saveAll} loading={isSaving} disabled={isLoading || isSaving}>
            {t('saveAll')}
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Card className="!rounded-2xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented
                value={activeLocale}
                onChange={(v) => setActiveLocale(v as LocaleKey)}
                options={[
                  { label: 'RU', value: 'ru' },
                  { label: 'EN', value: 'en' },
                ]}
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => saveLocale(activeLocale)}
                  type="primary"
                  loading={isSaving}
                  disabled={isLoading || isSaving}
                >
                  {t('saveLocale', { locale: activeLocale.toUpperCase() })}
                </Button>
              </div>
            </div>

            <div>
              <Typography.Text className="block">{t('titleLabel')}</Typography.Text>
              <Input
                value={activeForm.title}
                onChange={(e) => setActiveForm({ ...activeForm, title: e.target.value })}
                size="large"
                placeholder={activeLocale === 'ru' ? t('placeholderTitleRu') : t('placeholderTitleEn')}
                disabled={isLoading || isSaving}
              />
            </div>

            <div>
              <Typography.Text className="block">{t('descriptionLabel')}</Typography.Text>
              <Input.TextArea
                value={activeForm.description}
                onChange={(e) => setActiveForm({ ...activeForm, description: e.target.value })}
                placeholder={activeLocale === 'ru' ? t('placeholderDescRu') : t('placeholderDescEn')}
                autoSize={{ minRows: 4, maxRows: 10 }}
                disabled={isLoading || isSaving}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card size="small" className="!rounded-2xl" title={t('currentBackendRu')}>
                <div className="text-sm">
                  <div className="font-medium">{ruInitial.title || '—'}</div>
                  <div className="mt-1 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                    {ruInitial.description || '—'}
                  </div>
                </div>
              </Card>

              <Card size="small" className="!rounded-2xl" title={t('currentBackendEn')}>
                <div className="text-sm">
                  <div className="font-medium">{enInitial.title || '—'}</div>
                  <div className="mt-1 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                    {enInitial.description || '—'}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
