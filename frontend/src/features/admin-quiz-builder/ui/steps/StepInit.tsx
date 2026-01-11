'use client';

import { Input, Typography } from 'antd';
import { useTranslations } from 'next-intl';

import { SectionCard } from '../SectionCard';
import { FieldError } from '../FieldError';
import { useAdminQuizBuilderStore } from '../../model/store';
import { generateEntityCode } from '@/shared/lib/code/generateEntityCode';

export function StepInit({ errors }: { errors: Record<string, string> }) {
  const t = useTranslations('AdminQuizBuilder.init');

  const init = useAdminQuizBuilderStore((s) => s.init);
  const patchInit = useAdminQuizBuilderStore((s) => s.patchInit);

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

              if (!init.codeTouched) {
                patchInit({ code: generateEntityCode(title || 'quiz') });
              }
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
            onChange={(e) => patchInit({ code: e.target.value, codeTouched: true })}
            placeholder={t('quizCodePh')}
            size="large"
          />
          <FieldError code={errors.code} />
        </div>

        <div>
          <Typography.Text className="block">{t('quizDescription')}</Typography.Text>
          <Input.TextArea
            value={init.description}
            onChange={(e) => patchInit({ description: e.target.value })}
            placeholder={t('quizDescriptionPh')}
            autoSize={{ minRows: 3, maxRows: 8 }}
          />
          <FieldError code={errors.description} />
        </div>
      </div>
    </SectionCard>
  );
}
