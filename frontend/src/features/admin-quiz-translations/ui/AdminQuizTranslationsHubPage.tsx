'use client';

import { Button, Card, Drawer, Segmented, Typography, Grid } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { AdminEntityTranslationsPage } from './AdminEntityTranslationsPage';
import { QUIZ_TRANSLATIONS_CONFIG } from '../model/entityConfigs';
import type { QuizTranslatableRow } from '../model/types';
import { QuizEntitiesTable } from './QuizEntitiesTable';

export type HubTab =
  | 'quiz'
  | 'questions'
  | 'options'
  | 'traits'
  | 'professions'
  | 'categories';

const { useBreakpoint } = Grid;

export function AdminQuizTranslationsHubPage(props: {
  quizId: number;
  quizDefaults?: { title?: string; description?: string };
  questionsRows: QuizTranslatableRow[];
  optionsRows: QuizTranslatableRow[];
  traitsRows: QuizTranslatableRow[];
  professionsRows: QuizTranslatableRow[];
  categoriesRows: QuizTranslatableRow[];
  isLoadingQuestions?: boolean;
  isLoadingOptions?: boolean;
  isLoadingTraits?: boolean;
  isLoadingProfessions?: boolean;
  isLoadingCategories?: boolean;
}) {
  const {
    quizId,
    quizDefaults,
    questionsRows,
    optionsRows,
    traitsRows,
    professionsRows,
    categoriesRows,
    isLoadingQuestions,
    isLoadingOptions,
    isLoadingTraits,
    isLoadingProfessions,
    isLoadingCategories,
  } = props;

  const t = useTranslations('AdminQuizTranslationsHub');
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const [tab, setTab] = useState<HubTab>('quiz');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const title = useMemo(() => t('title', { id: quizId }), [t, quizId]);

  const tabs = useMemo(
    () =>
      [
        { value: 'quiz', label: t('tabQuiz') },
        { value: 'questions', label: t('tabQuestions') },
        { value: 'options', label: t('tabOptions') },
        { value: 'traits', label: t('tabTraits') },
        { value: 'professions', label: t('tabProfessions') },
        { value: 'categories', label: t('tabCategories') },
      ] as Array<{ value: HubTab; label: string }>,
    [t],
  );

  const activeTabLabel = useMemo(
    () => tabs.find((x) => x.value === tab)?.label ?? '',
    [tabs, tab],
  );

  function openTab(next: HubTab) {
    setTab(next);
    setDrawerOpen(false);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:py-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Typography.Title level={2} className="!m-0">
              {title}
            </Typography.Title>
            <Typography.Text type="secondary" className="block">
              {t('subtitle')}
            </Typography.Text>
          </div>

          {isMobile ? (
            <>
              <Button onClick={() => setDrawerOpen(true)}>
                {activeTabLabel}
              </Button>
              <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={t('sections')}
                placement="bottom"
                height="auto"
              >
                <div className="flex flex-col gap-2">
                  {tabs.map((x) => (
                    <Button
                      key={x.value}
                      type={x.value === tab ? 'primary' : 'default'}
                      block
                      onClick={() => openTab(x.value)}
                    >
                      {x.label}
                    </Button>
                  ))}
                </div>
              </Drawer>
            </>
          ) : (
            <Segmented
              value={tab}
              onChange={(v) => setTab(v as HubTab)}
              options={tabs.map((x) => ({ value: x.value, label: x.label }))}
            />
          )}
        </div>

        {tab === 'quiz' ? (
          <Card className="!rounded-2xl" bodyStyle={{ padding: 0 }}>
            <div className="p-4 sm:p-6">
              <AdminEntityTranslationsPage
                entityId={quizId}
                config={QUIZ_TRANSLATIONS_CONFIG}
                backHref={`/admin/quizzes/${quizId}`}
                titleKey="pageTitleQuiz"
                defaults={{
                  title: quizDefaults?.title ?? '',
                  description: quizDefaults?.description ?? '',
                }}
              />
            </div>
          </Card>
        ) : null}

        {tab === 'questions' ? (
          <QuizEntitiesTable
            title={t('questionsTitle')}
            rows={questionsRows}
            isLoading={isLoadingQuestions}
            entityType="question"
            requiredFields={['text']}
            t={
              t as unknown as (
                key: string,
                values?: Record<string, unknown>,
              ) => string
            }
          />
        ) : null}

        {tab === 'options' ? (
          <QuizEntitiesTable
            title={t('optionsTitle')}
            rows={optionsRows}
            isLoading={isLoadingOptions}
            entityType="question_option"
            requiredFields={['text']}
            t={
              t as unknown as (
                key: string,
                values?: Record<string, unknown>,
              ) => string
            }
          />
        ) : null}

        {tab === 'traits' ? (
          <QuizEntitiesTable
            title={t('traitsTitle')}
            rows={traitsRows}
            isLoading={isLoadingTraits}
            entityType="trait"
            requiredFields={['title']}
            t={
              t as unknown as (
                key: string,
                values?: Record<string, unknown>,
              ) => string
            }
          />
        ) : null}

        {tab === 'professions' ? (
          <QuizEntitiesTable
            title={t('professionsTitle')}
            rows={professionsRows}
            isLoading={isLoadingProfessions}
            entityType="profession"
            requiredFields={['title']}
            t={
              t as unknown as (
                key: string,
                values?: Record<string, unknown>,
              ) => string
            }
          />
        ) : null}

        {tab === 'categories' ? (
          <QuizEntitiesTable
            title={t('categoriesTitle')}
            rows={categoriesRows}
            isLoading={isLoadingCategories}
            entityType="profession_category"
            requiredFields={['title']}
            t={
              t as unknown as (
                key: string,
                values?: Record<string, unknown>,
              ) => string
            }
          />
        ) : null}
      </div>
    </div>
  );
}
