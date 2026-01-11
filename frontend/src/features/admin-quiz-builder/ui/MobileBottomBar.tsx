'use client';

import { Button } from 'antd';
import type { BuilderStep } from '../model/store';
import { useTranslations } from 'next-intl';

export function MobileBottomBar({
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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Button onClick={onPrev} disabled={step === 0} className="w-full">
          {t('back')}
        </Button>
        <Button
          type="primary"
          onClick={onNext}
          disabled={!canGoNext}
          className="w-full"
        >
          {step === 4 ? t('done') : t('next')}
        </Button>
      </div>
    </div>
  );
}
