'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Typography, message, Spin } from 'antd';
import { useTranslations } from 'next-intl';

import { useAdminQuizBuilderStore } from '../model/store';
import { validateInit, validateScales, validateQuestions, validateResults } from '../model/validators';

import { useQuizBuilderActions } from '@/features/admin-quiz-builder/api/useQuizBuilderActions';
import { useEnsureQuizTraits } from '../api/useEnsureQuizTraits';
import { useCreateOrUpdateQuiz } from '../api/useCreateOrUpdateQuiz';

import { useAdminQuiz } from '@/entities/quiz/api/useAdminQuiz';
import { useGetQuizVersions } from '@/entities/quiz/api/useGetQuizVersions';
import { pickLatestQuizVersion } from '@/features/admin-quiz-builder/lib/quizVersion';

import { StepperHeader } from './StepperHeader';
import { StepActions } from './StepActions';
import { MobileBottomBar } from './MobileBottomBar';

import { StepInit } from './steps/StepInit';
import { StepScales } from './steps/StepScales';
import { StepQuestions } from './steps/StepQuestions';
import { StepResults } from './steps/StepResults';
import { StepPreview } from './steps/StepPreview';

function n(v: unknown): number | undefined {
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : undefined;
}

export function AdminQuizBuilderPage({ quizId: propQuizId }: { quizId?: number } = {}) {
  const t = useTranslations('AdminQuizBuilder');

  const step = useAdminQuizBuilderStore((s) => s.step);
  const setStep = useAdminQuizBuilderStore((s) => s.setStep);

  const storeQuizId = useAdminQuizBuilderStore((s) => s.quizId);
  const quizVersionId = useAdminQuizBuilderStore((s) => s.quizVersionId);

  const init = useAdminQuizBuilderStore((s) => s.init);
  const scales = useAdminQuizBuilderStore((s) => s.scales);
  const questions = useAdminQuizBuilderStore((s) => s.questions);
  const results = useAdminQuizBuilderStore((s) => s.results);

  const resetStore = useAdminQuizBuilderStore((s) => s.reset);
  const hydrateFromServerQuiz = useAdminQuizBuilderStore((s) => s.hydrateFromServerQuiz);
  const setQuizContext = useAdminQuizBuilderStore((s) => s.setQuizContext);

  const effectiveQuizId = useMemo(() => n(propQuizId ?? storeQuizId), [propQuizId, storeQuizId]);

  const { data: quizData, isLoading: quizLoading } = useAdminQuiz(propQuizId ?? 0, {
    query: { enabled: typeof propQuizId === 'number' },
  });

  const { data: versionsRes, isLoading: versionsLoading } = useGetQuizVersions(effectiveQuizId);

  const latestVersion = useMemo(() => pickLatestQuizVersion(versionsRes), [versionsRes]);
  const latestQuizVersionId = useMemo(() => n((latestVersion as any)?.id), [latestVersion]);
  const latestVersionNumber = useMemo(() => n((latestVersion as any)?.version), [latestVersion]);

  useEffect(() => {
    if (!propQuizId) resetStore();
  }, [propQuizId, resetStore]);

  useEffect(() => {
    if (propQuizId && quizData) hydrateFromServerQuiz(quizData as any);
  }, [propQuizId, quizData, hydrateFromServerQuiz]);

  useEffect(() => {
    if (typeof effectiveQuizId !== 'number') return;
    if (typeof quizVersionId === 'number') return;

    if (typeof latestQuizVersionId === 'number') {
      setQuizContext({
        quizId: effectiveQuizId,
        version: typeof latestVersionNumber === 'number' ? latestVersionNumber : 1,
        quizVersionId: latestQuizVersionId,
      });
    }
  }, [effectiveQuizId, quizVersionId, latestQuizVersionId, latestVersionNumber, setQuizContext]);

  const actions = useQuizBuilderActions(
    typeof effectiveQuizId === 'number' ? effectiveQuizId : 0,
    typeof quizVersionId === 'number' ? quizVersionId : 0,
  );

  const ensureTraits = useEnsureQuizTraits(actions);
  const createOrUpdateQuiz = useCreateOrUpdateQuiz(actions);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setSubmitAttempted(false);
  }, [step]);

  const traitIds = useMemo(
    () => scales.map((s) => s.traitId).filter((x): x is number => typeof x === 'number'),
    [scales],
  );

  const canGoNext = useMemo(() => {
    if (step === 0)
      return Object.keys(validateInit({ title: init.title, code: init.code, description: init.description })).length === 0;
    if (step === 1) return scales.length === 0 || Object.keys(validateScales(scales)).length === 0;
    if (step === 2) return Object.keys(validateQuestions(questions, traitIds)).length === 0;
    if (step === 3) return Object.keys(validateResults(results)).length === 0;
    return true;
  }, [step, init.title, init.code, init.description, scales, questions, traitIds, results]);

  const hasContext = typeof effectiveQuizId === 'number' && typeof quizVersionId === 'number';

  const goPrev = () => {
    setErrors({});
    setSubmitAttempted(false);
    setStep(Math.max(0, step - 1) as any);
  };

  const goNext = async () => {
    let e: Record<string, string> = {};
    if (step === 0) e = validateInit({ title: init.title, code: init.code, description: init.description });
    if (step === 1) e = validateScales(scales);
    if (step === 2) e = validateQuestions(questions, traitIds);
    if (step === 3) e = validateResults(results);

    setErrors(e);

    if (Object.keys(e).length > 0) {
      setSubmitAttempted(true);
      message.error(t('validation.fixErrors'));
      return;
    }

    setSubmitAttempted(false);

    if (step === 0) {
      const ok = await createOrUpdateQuiz(
        {
          quizId: effectiveQuizId,
          title: init.title,
          code: init.code,
          descriptionDefault: init.description,
        },
        typeof effectiveQuizId === 'number',
      );
      if (!ok) return;

      setStep((step + 1) as any);
      return;
    }

    if (step === 1) {
      if (scales.length > 0) {
        const ok = await ensureTraits();
        if (!ok) return;
      }
      setStep((step + 1) as any);
      return;
    }

    if (step === 2) {
      const qid = n(useAdminQuizBuilderStore.getState().quizId) ?? effectiveQuizId;
      const qvid = n(useAdminQuizBuilderStore.getState().quizVersionId) ?? latestQuizVersionId;

      if (typeof qid !== 'number' || typeof qvid !== 'number') {
        message.error(t('validation.quizOperationError'));
        return;
      }

      try {
        for (const q of questions) {
          let questionId = q.questionId;

          if (typeof questionId === 'number') {
            const qRes: any = await actions.updateQuestion.mutateAsync({
              id: questionId,
              data: { qtype: q.qtype, text: q.text, ord: q.ord } as any,
            });
            const updated = qRes?.data ?? qRes?.result ?? qRes;
            questionId = typeof updated?.id === 'number' ? updated.id : questionId;
          } else {
            const qRes: any = await actions.createQuestion.mutateAsync({
              data: { qtype: q.qtype, text: q.text, ord: q.ord } as any,
            });
            const created = qRes?.data ?? qRes?.result ?? qRes;
            questionId = typeof created?.id === 'number' ? created.id : undefined;
          }

          if (typeof questionId !== 'number') throw new Error('Failed to create or update question');

          for (const opt of q.options.slice().sort((a, b) => a.ord - b.ord)) {
            let optionId = opt.optionId;

            if (typeof optionId === 'number') {
              await actions.updateOption.mutateAsync({
                id: optionId,
                data: { label: opt.label, ord: opt.ord } as any,
              });
            } else {
              const optRes: any = await actions.createOption.mutateAsync({
                data: { questionId, label: opt.label, ord: opt.ord } as any,
              });

              const createdOpt = optRes?.data ?? optRes?.result ?? optRes;
              optionId = typeof createdOpt?.id === 'number' ? createdOpt.id : undefined;

              if (typeof optionId !== 'number') throw new Error('Failed to create option');

              opt.optionId = optionId;
            }

            if (typeof optionId !== 'number') continue;

            const weightsObj = opt.weightsByTraitId ?? {};
            const traits = Object.keys(weightsObj)
              .map((k) => ({ traitId: Number(k), weight: (weightsObj as any)[k] }))
              .filter((x) => Number.isFinite(x.traitId) && typeof x.weight === 'number');

            if (traits.length > 0) {
              await actions.assignOptionTraits.mutateAsync({
                optionId,
                data: { traits } as any,
              });
            }
          }
        }
      } catch (err: any) {
        message.error(err?.message || t('validation.quizOperationError'));
        return;
      }

      setStep((step + 1) as any);
      return;
    }

    if (step === 3) {
      const selectedCategoryId = Array.isArray(results.selectedCategoryIds) ? results.selectedCategoryIds[0] : undefined;

      if (typeof effectiveQuizId === 'number' && typeof selectedCategoryId === 'number') {
        try {
          await actions.updateQuiz.mutateAsync({
            id: effectiveQuizId as any,
            data: { categoryId: selectedCategoryId } as any,
          });
        } catch (err: any) {
          message.error(err?.message || t('validation.quizOperationError'));
          return;
        }
      }

      setStep((step + 1) as any);
      return;
    }

    setStep((step + 1) as any);
  };

  if (
    (propQuizId && quizLoading) ||
    (typeof effectiveQuizId === 'number' && versionsLoading && !latestVersion && typeof quizVersionId !== 'number')
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

        {step > 0 && !hasContext ? <Alert type="warning" title={t('needQuizContext')} /> : null}

        <div className="flex flex-col gap-4 sm:gap-6">
          {step === 0 ? <StepInit errors={errors} submitAttempted={submitAttempted} /> : null}
          {step === 1 ? <StepScales errors={errors} submitAttempted={submitAttempted} /> : null}
          {step === 2 ? <StepQuestions errors={errors} submitAttempted={submitAttempted} /> : null}
          {step === 3 ? <StepResults errors={errors} submitAttempted={submitAttempted} /> : null}
          {step === 4 ? <StepPreview /> : null}
        </div>

        <div className="hidden sm:block">
          <StepActions step={step} onPrev={goPrev} onNext={goNext} canGoNext={canGoNext} />
        </div>

        <div className="sm:hidden">
          <MobileBottomBar step={step} onPrev={goPrev} onNext={goNext} canGoNext={canGoNext} />
        </div>
      </div>
    </div>
  );
}
