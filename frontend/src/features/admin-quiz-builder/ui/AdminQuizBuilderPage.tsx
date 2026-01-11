'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Typography, message } from 'antd';
import { useTranslations } from 'next-intl';

import { useAdminQuizBuilderStore } from '../model/store';
import {
  validateInit,
  validateScales,
  validateQuestions,
  validateResults,
} from '../model/validators';

import { useQuizBuilderActions } from '@/features/admin-quiz-builder/api/useQuizBuilderActions';

import { StepperHeader } from './StepperHeader';
import { StepActions } from './StepActions';
import { MobileBottomBar } from './MobileBottomBar';

import { StepInit } from './steps/StepInit';
import { StepScales } from './steps/StepScales';
import { StepQuestions } from './steps/StepQuestions';
import { StepResults } from './steps/StepResults';
import { StepPreview } from './steps/StepPreview';

export function AdminQuizBuilderPage() {
  const t = useTranslations('AdminQuizBuilder');
  const router = useRouter();

  const step = useAdminQuizBuilderStore((s) => s.step);
  const setStep = useAdminQuizBuilderStore((s) => s.setStep);

  const quizId = useAdminQuizBuilderStore((s) => s.quizId);
  const version = useAdminQuizBuilderStore((s) => s.version);
  const quizVersionId = useAdminQuizBuilderStore((s) => s.quizVersionId);

  const init = useAdminQuizBuilderStore((s) => s.init);
  const scales = useAdminQuizBuilderStore((s) => s.scales);
  const questions = useAdminQuizBuilderStore((s) => s.questions);
  const results = useAdminQuizBuilderStore((s) => s.results);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const traitIds = useMemo(
    () => scales.map((s) => s.traitId).filter((x): x is number => typeof x === 'number'),
    [scales],
  );

  const actions =
    typeof quizId === 'number' && typeof version === 'number'
      ? useQuizBuilderActions(quizId, version)
      : null;

  const canGoNext = useMemo(() => {
    if (step === 0) return Object.keys(validateInit({ title: init.title, code: init.code })).length === 0;
    if (step === 1) return Object.keys(validateScales(scales)).length === 0;
    if (step === 2) return Object.keys(validateQuestions(questions, traitIds)).length === 0;
    if (step === 3) return Object.keys(validateResults(results)).length === 0;
    return true;
  }, [step, init.title, init.code, scales, questions, traitIds, results]);

  function goPrev() {
    setErrors({});
    setStep((Math.max(0, step - 1) as unknown) as any);
  }

  function goNext() {
    let e: Record<string, string> = {};
    if (step === 0) e = validateInit({ title: init.title, code: init.code });
    if (step === 1) e = validateScales(scales);
    if (step === 2) e = validateQuestions(questions, traitIds);
    if (step === 3) e = validateResults(results);

    setErrors(e);

    if (Object.keys(e).length > 0) {
      message.error(t('validation.fixErrors'));
      return;
    }

    setStep(((step + 1) as unknown) as any);
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

        {step > 0 && (!quizId || !version) ? (
          <Alert type="warning" message={t('needQuizContext')} />
        ) : null}

        <div className="flex flex-col gap-4 sm:gap-6">
          {step === 0 ? <StepInit errors={errors} /> : null}
          {step === 1 ? <StepScales errors={errors} /> : null}
          {step === 2 ? <StepQuestions errors={errors} /> : null}
          {step === 3 ? <StepResults errors={errors} /> : null}
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
