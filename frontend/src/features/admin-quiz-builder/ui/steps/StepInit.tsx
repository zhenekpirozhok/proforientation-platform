'use client';

import { Button, Form, Input, Typography, message } from 'antd';
import { useTranslations } from 'next-intl';

import { SectionCard } from '../SectionCard';
import { FieldError } from '../FieldError';
import { useAdminQuizBuilderStore } from '../../model/store';
import { useAdminCreateQuiz } from '@/entities/quiz/api/useAdminCreateQuiz';

function slugify(v: string) {
  return v
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 32);
}

export function StepInit({ errors }: { errors: Record<string, string> }) {
  const t = useTranslations('AdminQuizBuilder.init');

  const init = useAdminQuizBuilderStore((s) => s.init);
  const patchInit = useAdminQuizBuilderStore((s) => s.patchInit);
  const setQuizContext = useAdminQuizBuilderStore((s) => s.setQuizContext);
  const setStep = useAdminQuizBuilderStore((s) => s.setStep);

  const createQuiz = useAdminCreateQuiz();

  async function onCreate() {
    try {
      const payload = {
        title: init.title,
        code: init.code,
      };

      const res = await createQuiz.mutateAsync({ data: payload as any });
      const quizId = (res as any).id as number;
      const version = ((res as any).version ?? 1) as number;
      const quizVersionId = (res as any).quizVersionId as number | undefined;

      if (typeof quizId === 'number') {
        setQuizContext({ quizId, version, quizVersionId });
        setStep(1);
        message.success(t('created'));
      } else {
        message.error(t('createFailed'));
      }
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  return (
    <SectionCard title={t('title')}>
      <div className="flex flex-col gap-4">
        <div>
          <Typography.Text className="block">{t('quizTitle')}</Typography.Text>
          <Input
            value={init.title}
            onChange={(e) => {
              const title = e.target.value;
              patchInit({ title });
              if (!init.code.trim()) patchInit({ code: slugify(title) });
            }}
            placeholder={t('quizTitlePh')}
            size="large"
          />
          <FieldError code={errors.title} />
        </div>

        <div>
          <Typography.Text className="block">{t('quizCode')}</Typography.Text>
          <Input
            value={init.code}
            onChange={(e) => patchInit({ code: e.target.value })}
            placeholder={t('quizCodePh')}
            size="large"
          />
          <FieldError code={errors.code} />
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="primary"
            size="large"
            loading={createQuiz.isPending}
            onClick={onCreate}
          >
            {t('continue')}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
