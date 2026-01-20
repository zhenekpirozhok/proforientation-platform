'use client';

import { Alert, Typography, Spin } from 'antd';
import { StepperHeader } from './StepperHeader';
import { StepActions } from './StepActions';
import { MobileBottomBar } from './MobileBottomBar';

import { StepInit } from './steps/StepInit';
import { StepScales } from './steps/StepScales';
import { StepQuestions } from './steps/StepQuestions';
import { StepResults } from './steps/StepResults';
import { StepPreview } from './steps/StepPreview';

import { useAdminQuizBuilder } from '../model/useAdminQuizBuilder';

export function AdminQuizBuilderPage({
  quizId: propQuizId,
}: { quizId?: number } = {}) {
  const {
    t,
    step,
    errors,
    submitAttempted,
    quizLoading,
    versionsLoading,
    effectiveQuizId,
    latestVersion,
    quizVersionId,
    hasContext,
    canGoNext,
    goPrev,
    goNext,
  } = useAdminQuizBuilder({ quizId: propQuizId });

  if (
    (propQuizId && quizLoading) ||
    (typeof effectiveQuizId === 'number' &&
      versionsLoading &&
      !latestVersion &&
      typeof quizVersionId !== 'number')
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:py-8">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Typography.Title level={2} className="!m-0">
              {t('title')}
            </Typography.Title>
            <Typography.Text type="secondary" className="block">
              {t('subtitle')}
            </Typography.Text>
          </div>
        </div>

        <StepperHeader step={step} />

        {step > 0 && !hasContext ? (
          <Alert type="warning" title={t('needQuizContext')} />
        ) : null}

        <div className="flex flex-col gap-4 sm:gap-6">
          {step === 0 ? (
            <StepInit errors={errors} submitAttempted={submitAttempted} />
          ) : null}
          {step === 1 ? (
            <StepScales errors={errors} submitAttempted={submitAttempted} />
          ) : null}
          {step === 2 ? (
            <StepQuestions errors={errors} submitAttempted={submitAttempted} />
          ) : null}
          {step === 3 ? (
            <StepResults errors={errors} submitAttempted={submitAttempted} />
          ) : null}
          {step === 4 ? <StepPreview /> : null}
        </div>

        <div className="hidden sm:block">
          <StepActions
            step={step}
            onPrev={goPrev}
            onNext={goNext}
            canGoNext={canGoNext}
          />
        </div>

        <div className="sm:hidden">
          <MobileBottomBar
            step={step}
            onPrev={goPrev}
            onNext={goNext}
            canGoNext={canGoNext}
          />
        </div>
      </div>
    </div>
  );
}
