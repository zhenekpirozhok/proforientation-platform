'use client';

import { Button, Divider, Typography, message } from 'antd';
import { useTranslations } from 'next-intl';

import { SectionCard } from '../SectionCard';
import { useAdminQuizBuilderStore } from '../../model/store';
import { useQuizBuilderActions } from '@/features/admin-quiz-builder/api/useQuizBuilderActions';

export function StepPreview() {
  const t = useTranslations('AdminQuizBuilder.preview');

  const quizId = useAdminQuizBuilderStore((s) => s.quizId);
  const version = useAdminQuizBuilderStore((s) => s.version);

  const init = useAdminQuizBuilderStore((s) => s.init);
  const scales = useAdminQuizBuilderStore((s) => s.scales);
  const questions = useAdminQuizBuilderStore((s) => s.questions);
  const results = useAdminQuizBuilderStore((s) => s.results);

  const actions =
    typeof quizId === 'number' && typeof version === 'number'
      ? useQuizBuilderActions(quizId, version)
      : null;

  async function onPublish() {
    if (!actions || typeof quizId !== 'number') return;

    try {
      await actions.publishQuiz.mutateAsync({ id: quizId } as any);
      message.success(t('published'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  return (
    <SectionCard title={t('title')}>
      <div className="flex flex-col gap-3">
        <Typography.Title level={4} className="!m-0">
          {init.title}
        </Typography.Title>
        <Typography.Text type="secondary">{init.code}</Typography.Text>

        <Divider className="!my-3" />

        <Typography.Text className="font-medium">{t('scales')}</Typography.Text>
        <Typography.Text type="secondary">
          {scales.map((s) => s.name).join(', ') || t('none')}
        </Typography.Text>

        <Divider className="!my-3" />

        <Typography.Text className="font-medium">{t('questions')}</Typography.Text>
        <Typography.Text type="secondary">
          {t('questionsCount', { count: questions.length })}
        </Typography.Text>

        <Divider className="!my-3" />

        <Typography.Text className="font-medium">{t('results')}</Typography.Text>
        <Typography.Text type="secondary">
          {t('categoriesCount', { count: results.selectedCategoryIds.length })},{' '}
          {t('professionsCount', { count: results.selectedProfessionIds.length })}
        </Typography.Text>

        <div className="mt-4 flex justify-end">
          <Button
            type="primary"
            size="large"
            onClick={onPublish}
            loading={actions?.publishQuiz.isPending}
            disabled={!actions || typeof quizId !== 'number'}
          >
            {t('publish')}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
