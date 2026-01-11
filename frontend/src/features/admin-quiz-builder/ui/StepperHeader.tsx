'use client';

import { Steps } from 'antd';
import { useTranslations } from 'next-intl';
import type { BuilderStep } from '../model/store';

export function StepperHeader({ step }: { step: BuilderStep }) {
  const t = useTranslations('AdminQuizBuilder.steps');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <Steps
        current={step}
        items={[
          { title: t('init') },
          { title: t('scales') },
          { title: t('questions') },
          { title: t('results') },
          { title: t('preview') },
        ]}
      />
    </div>
  );
}
