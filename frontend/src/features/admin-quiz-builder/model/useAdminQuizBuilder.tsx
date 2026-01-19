'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { normalizeWeights, useAdminQuizBuilderStore } from './store';
import { validateInit, validateScales, validateQuestions, validateResults } from './validators';

import { useQuizBuilderActions } from '@/features/admin-quiz-builder/api/useQuizBuilderActions';
import { useEnsureQuizTraits } from '../api/useEnsureQuizTraits';
import { useCreateOrUpdateQuiz } from '../api/useCreateOrUpdateQuiz';
import { useEnsureUnpublishedVersion } from '../api/useEnsureUnpublishedVersion';

import { useAdminQuiz } from '@/entities/quiz/api/useAdminQuiz';
import { useGetQuizVersions } from '@/entities/quiz/api/useGetQuizVersions';
import { pickLatestQuizVersion } from '@/features/admin-quiz-builder/lib/quizVersion';

function n(v: unknown): number | undefined {
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : undefined;
}

function toArray(v: unknown): any[] {
  if (Array.isArray(v)) return v as any[];
  if (!v || typeof v !== 'object') return [];
  const o = v as any;
  if (Array.isArray(o.items)) return o.items as any[];
  if (Array.isArray(o.results)) return o.results as any[];
  if (Array.isArray(o.rows)) return o.rows as any[];
  if (Array.isArray(o.content)) return o.content as any[];
  if (o.data !== undefined) return toArray(o.data);
  if (o.result !== undefined) return toArray(o.result);
  if (o.payload !== undefined) return toArray(o.payload);
  return [];
}

function toNumber(v: unknown): number | undefined {
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : undefined;
}

export function useAdminQuizBuilder({ quizId: propQuizId }: { quizId?: number } = {}) {
  const t = useTranslations('AdminQuizBuilder');

  const step = useAdminQuizBuilderStore((s) => s.step);
  const setStep = useAdminQuizBuilderStore((s) => s.setStep);

  const storeQuizId = useAdminQuizBuilderStore((s) => s.quizId);
  const quizVersionId = useAdminQuizBuilderStore((s) => s.quizVersionId);

  const init = useAdminQuizBuilderStore((s) => s.init);
  const serverInit = useAdminQuizBuilderStore((s) => s.serverInit);

  const scales = useAdminQuizBuilderStore((s) => s.scales);
  const questions = useAdminQuizBuilderStore((s) => s.questions);
  const results = useAdminQuizBuilderStore((s) => s.results);

  const resetStore = useAdminQuizBuilderStore((s) => s.reset);
  const hydrateFromServerQuiz = useAdminQuizBuilderStore((s) => s.hydrateFromServerQuiz);
  const setQuizContext = useAdminQuizBuilderStore((s) => s.setQuizContext);
  const hydrated = useAdminQuizBuilderStore((s) => s.hydrated);

  const createdToastShownRef = useRef(false);

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
    if (propQuizId && quizData && hydrated && step === 0) {
      hydrateFromServerQuiz(quizData as any);
    }
  }, [propQuizId, quizData, hydrateFromServerQuiz, hydrated, step]);

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
    typeof latestQuizVersionId === 'number' ? latestQuizVersionId : 0,
    typeof latestVersionNumber === 'number' ? latestVersionNumber : undefined,
  );

  const setScales = useAdminQuizBuilderStore((s) => s.setScales);
  const setScaleMode = useAdminQuizBuilderStore((s) => s.setScaleMode);
  const setQuestions = useAdminQuizBuilderStore((s) => s.setQuestions);

  const ensureTraits = useEnsureQuizTraits(actions);
  const createOrUpdateQuiz = useCreateOrUpdateQuiz(actions, latestVersion);
  const ensureUnpublishedVersion = useEnsureUnpublishedVersion(actions, latestVersion);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSubmitAttempted(false);
  }, [step]);

  useEffect(() => {
    const ensureVersion = async () => {
      if (
        typeof effectiveQuizId !== 'number' ||
        !latestVersion ||
        !quizData
      ) return;

      const isPublished = Boolean(latestVersion?.publishedAt);
      if (isPublished) {
        await ensureUnpublishedVersion(effectiveQuizId);
      }
    };

    ensureVersion();
  }, [effectiveQuizId, latestVersion?.id, latestVersion?.publishedAt, quizData]);

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
      const unchanged =
        typeof effectiveQuizId === 'number' &&
        serverInit &&
        serverInit.title === init.title &&
        serverInit.code === init.code &&
        serverInit.description === init.description;

      if (!unchanged) {
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
      }

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
      setStep((step + 1) as any);
      return;
    }

    if (step === 3) {
      const selectedCategoryId = Array.isArray(results.selectedCategoryIds) ? results.selectedCategoryIds[0] : undefined;

      if (typeof effectiveQuizId === 'number' && typeof selectedCategoryId === 'number') {
        try {
          const versionOk = await ensureUnpublishedVersion(effectiveQuizId);
          if (!versionOk) return;

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

  useEffect(() => {
    if (step > 4) {
      if (!createdToastShownRef.current) {
        createdToastShownRef.current = true;
        message.success(t('toastCreated'));
        try {
          resetStore();
        } catch {}
        router.push('/admin');
      }
    } else {
      createdToastShownRef.current = false;
    }
  }, [step, router, t]);

  const traitsData = (actions as any)?.quizTraits?.data;
  const questionsData = (actions as any)?.quizQuestions?.data;

  useEffect(() => {
    try {
      const backendTraits: any[] = toArray(traitsData);
      if (typeof effectiveQuizId !== 'number' || backendTraits.length === 0) return;
      if (scales.length > 0) return;

      function lid(prefix: string) {
        return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
      }

      const scaleDrafts: any[] = backendTraits
        .flatMap((tr: any) => {
          const polarity = (tr?.polarity ?? tr?.mode ?? tr?.type ?? 'single') as 'single' | 'bipolar';

          if (polarity === 'bipolar') {
            const pairId = String(tr?.pairId ?? tr?.pairCode ?? tr?.bipolarPairCode ?? lid('pair'));
            const pairCode = tr?.pairCode ?? tr?.bipolarPairCode ?? '';

            const left = tr?.left ?? tr?.negative ?? tr?.a ?? {};
            const right = tr?.right ?? tr?.positive ?? tr?.b ?? {};

            const leftTraitId = toNumber(left?.id ?? left?.traitId ?? tr?.leftTraitId);
            const rightTraitId = toNumber(right?.id ?? right?.traitId ?? tr?.rightTraitId);

            return [
              {
                tempId: lid('scale'),
                traitId: leftTraitId,
                polarity: 'bipolar',
                side: 'LEFT',
                pairId,
                bipolarPairCode: pairCode,
                name: left?.name ?? left?.title ?? tr?.leftName ?? '',
                code: left?.code ?? tr?.leftCode ?? '',
                description: left?.description ?? tr?.leftDescription ?? '',
                codeTouched: true,
              },
              {
                tempId: lid('scale'),
                traitId: rightTraitId,
                polarity: 'bipolar',
                side: 'RIGHT',
                pairId,
                bipolarPairCode: pairCode,
                name: right?.name ?? right?.title ?? tr?.rightName ?? '',
                code: right?.code ?? tr?.rightCode ?? '',
                description: right?.description ?? tr?.rightDescription ?? '',
                codeTouched: true,
              },
            ];
          }

          const tid = toNumber(tr?.id ?? tr?.traitId);
          return [
            {
              tempId: lid('scale'),
              traitId: tid,
              polarity: 'single',
              name: tr?.name ?? tr?.title ?? '',
              code: tr?.code ?? '',
              description: tr?.description ?? '',
              codeTouched: true,
            },
          ];
        })
        .filter(Boolean);

      const detectedMode: 'single' | 'bipolar' | null =
        scaleDrafts.some((s) => s.polarity === 'bipolar') ? 'bipolar' : scaleDrafts.length > 0 ? 'single' : null;

      if (scaleDrafts.length > 0) {
        setScales(scaleDrafts as any);
        if (detectedMode) setScaleMode(detectedMode);
      }
    } catch {}
  }, [traitsData, effectiveQuizId, scales.length, setScales, setScaleMode]);

  useEffect(() => {
    try {
      const backendQuestions: any[] = toArray(questionsData);
      if (typeof effectiveQuizId !== 'number' || backendQuestions.length === 0) return;
      if (questions.length > 0 && questions.some((q) => typeof (q as any).questionId === 'number')) return;

      function lid(prefix: string) {
        return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
      }

      const questionDrafts = backendQuestions
        .map((qq: any, idx: number) => {
          const qtype = (qq?.qtype ?? qq?.type ?? 'SINGLE_CHOICE') as string;
          const ord = toNumber(qq?.ord ?? qq?.order ?? qq?.position) ?? idx + 1;

          const opts = Array.isArray(qq?.options) ? qq.options : qq?.answers ?? qq?.variants ?? [];
          const optionDrafts = opts.map((o: any, oidx: number) => ({
            tempId: lid('opt'),
            ord: toNumber(o?.ord ?? o?.order ?? o?.position) ?? oidx + 1,
            label: o?.label ?? o?.text ?? o?.title ?? '',
            optionId: toNumber(o?.id ?? o?.optionId),
            weightsByTraitId: normalizeWeights(o?.weightsByTraitId ?? o?.weights ?? o?.traitWeights ?? {}),
          }));

          const linkedTraitIdsRaw = Array.isArray(qq?.linkedTraitIds)
            ? qq.linkedTraitIds.filter((x: any) => typeof x === 'number')
            : Array.isArray(qq?.traitIds)
            ? qq.traitIds.filter((x: any) => typeof x === 'number')
            : [];

          const derivedTraitIds = Array.from(
            new Set(
              optionDrafts
                .flatMap((o: any) => Object.keys(o.weightsByTraitId ?? {}).map((k) => Number(k)))
                .filter((x: any) => Number.isFinite(x)),
            ),
          ).slice(0, 2);

          const linkedTraitIds = (linkedTraitIdsRaw.length > 0 ? linkedTraitIdsRaw : derivedTraitIds).slice(0, 2);

          return {
            tempId: lid('q'),
            ord,
            qtype,
            text: qq?.text ?? qq?.title ?? qq?.question ?? '',
            linkedTraitIds,
            questionId: toNumber(qq?.id ?? qq?.questionId),
            options:
              optionDrafts.length > 0
                ? optionDrafts
                : [{ tempId: lid('opt'), ord: 1, label: '', weightsByTraitId: {} }],
          } as any;
        })
        .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));

      if (questionDrafts.length > 0) setQuestions(questionDrafts as any);
    } catch {}
  }, [questionsData, effectiveQuizId, questions.length, setQuestions]);

  return {
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
  };
}
