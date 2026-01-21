'use client';

import { Card, Segmented, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { AdminEntityTranslationsPage } from './AdminEntityTranslationsPage';
import { QUIZ_TRANSLATIONS_CONFIG } from '../model/entityConfigs';
import type { QuizTranslatableRow } from '../model/types';
import { QuizEntitiesTable } from './QuizEntitiesTable';

export type HubTab = 'quiz' | 'questions' | 'options';

export function AdminQuizTranslationsHubPage(props: {
  quizId: number;
  quizDefaults?: { title?: string; description?: string };
  questionsRows: QuizTranslatableRow[];
  optionsRows: QuizTranslatableRow[];
  isLoadingQuestions?: boolean;
  isLoadingOptions?: boolean;
}) {
  const { quizId, quizDefaults, questionsRows, optionsRows, isLoadingQuestions, isLoadingOptions } = props;

  const t = useTranslations('AdminQuizTranslationsHub');
  const [tab, setTab] = useState<HubTab>('quiz');

  const title = useMemo(() => t('title', { id: quizId }), [t, quizId]);

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

          <Segmented
            value={tab}
            onChange={(v) => setTab(v as HubTab)}
            options={[
              { value: 'quiz', label: t('tabQuiz') },
              { value: 'questions', label: t('tabQuestions') },
              { value: 'options', label: t('tabOptions') },
            ]}
          />
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
    t={t}
  />
) : null}

{tab === 'options' ? (
  <QuizEntitiesTable
    title={t('optionsTitle')}
    rows={optionsRows}
    isLoading={isLoadingOptions}
    entityType="question_option"
    requiredFields={['text']}
    t={t}
  />
) : null}

      </div>
    </div>
  );
}
