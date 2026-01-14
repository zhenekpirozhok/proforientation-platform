'use client';

import { Input, Typography } from 'antd';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { SectionCard } from '../SectionCard';
import { FieldError } from '../FieldError';
import { useAdminQuizBuilderStore } from '../../model/store';
import { generateEntityCode } from '@/shared/lib/code/generateEntityCode';

import { useStepValidation } from '../../lib/validation/useStepValidation';
import { StepValidationSummary } from '../../lib/validation/StepValidationSummary';

export function StepInit({
  errors,
  submitAttempted,
}: {
  errors: Record<string, string>;
  submitAttempted?: boolean;
}) {
  const t = useTranslations('AdminQuizBuilder.init');

  const init = useAdminQuizBuilderStore((s) => s.init);
  const patchInit = useAdminQuizBuilderStore((s) => s.patchInit);

  const v = useStepValidation({ errors, submitAttempted });

  const summaryItems = useMemo(() => {
    const items: Array<{ field: string; label: string }> = [];
    if (v.showError('title')) items.push({ field: 'title', label: t('quizTitle') });
    if (v.showError('code')) items.push({ field: 'code', label: t('quizCode') });
    if (v.showError('description')) items.push({ field: 'description', label: t('quizDescription') });
    return items;
  }, [v, t]);

  return (
    <SectionCard title={t('title')}>
      <div className="flex flex-col gap-4">
        <StepValidationSummary title={t('validation.fixErrors')} items={summaryItems} />

        <div data-field="title">
          <Typography.Text className="block">{t('quizTitle')}</Typography.Text>
          <Input
            value={init.title}
            status={v.fieldStatus('title')}
            onBlur={() => v.markTouched('title')}
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
          {v.showError('title') ? <FieldError code={errors.title} /> : null}
        </div>

        <div data-field="code">
          <Typography.Text className="block">{t('quizCode')}</Typography.Text>
          <Input
            value={init.code}
            status={v.fieldStatus('code')}
            onBlur={() => v.markTouched('code')}
            onChange={(e) => patchInit({ code: e.target.value, codeTouched: true })}
            placeholder={t('quizCodePh')}
            size="large"
          />
          {v.showError('code') ? <FieldError code={errors.code} /> : null}
        </div>

        <div data-field="description">
          <Typography.Text className="block">{t('quizDescription')}</Typography.Text>
          <Input.TextArea
            value={init.description}
            status={v.fieldStatus('description')}
            onBlur={() => v.markTouched('description')}
            onChange={(e) => patchInit({ description: e.target.value })}
            placeholder={t('quizDescriptionPh')}
            autoSize={{ minRows: 3, maxRows: 8 }}
          />
          {v.showError('description') ? <FieldError code={errors.description} /> : null}
        </div>
      </div>
    </SectionCard>
  );
}
