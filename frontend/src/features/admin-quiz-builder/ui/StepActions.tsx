'use client';

import { Button } from 'antd';
import type { BuilderStep } from '../model/store';
import { useTranslations } from 'next-intl';

export function StepActions({
  step,
  onPrev,
  onNext,
  canGoNext,
}: {
  step: BuilderStep;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
}) {
  const t = useTranslations('AdminQuizBuilder.actions');

  return (
    <div className="flex items-center justify-between gap-3">
      <Button onClick={onPrev} disabled={step === 0}>
        {t('back')}
      </Button>
      <Button type="primary" onClick={onNext} disabled={!canGoNext}>
        {step === 4 ? t('done') : t('next')}
      </Button>
    </div>
  );
}
