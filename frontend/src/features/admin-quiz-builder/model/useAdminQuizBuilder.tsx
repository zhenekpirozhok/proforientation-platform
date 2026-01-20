'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { normalizeWeights, useAdminQuizBuilderStore } from './store';
import type {
  ScaleDraft,
  QuestionDraft,
  BuilderStep,
  OptionDraft,
} from './store';
import {
  validateInit,
  validateScales,
  validateQuestions,
  validateResults,
} from './validators';

import {
  useQuizBuilderActions,
  type ReturnTypeUseQuizBuilderActions,
} from '@/features/admin-quiz-builder/api/useQuizBuilderActions';
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

function toArray<T = unknown>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (!v || typeof v !== 'object') return [];
  const o = v as Record<string, unknown>;
  if (Array.isArray(o.items as unknown)) return o.items as T[];
  if (Array.isArray(o.results as unknown)) return o.results as T[];
  if (Array.isArray(o.rows as unknown)) return o.rows as T[];
  if (Array.isArray(o.content as unknown)) return o.content as T[];
  if ((o.data as unknown) !== undefined) return toArray<T>(o.data as unknown);
  if ((o.result as unknown) !== undefined)
    return toArray<T>(o.result as unknown);
  if ((o.payload as unknown) !== undefined)
    return toArray<T>(o.payload as unknown);
  return [];
}

function toNumber(v: unknown): number | undefined {
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : undefined;
}

export function useAdminQuizBuilder({
  quizId: propQuizId,
}: { quizId?: number } = {}) {
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
  const hydrateFromServerQuiz = useAdminQuizBuilderStore(
    (s) => s.hydrateFromServerQuiz,
  );
  const setQuizContext = useAdminQuizBuilderStore((s) => s.setQuizContext);
  const hydrated = useAdminQuizBuilderStore((s) => s.hydrated);

  const createdToastShownRef = useRef(false);

  const effectiveQuizId = useMemo(
    () => n(propQuizId ?? storeQuizId),
    [propQuizId, storeQuizId],
  );

  const { data: quizData, isLoading: quizLoading } = useAdminQuiz(
    propQuizId ?? 0,
    {
      query: { enabled: typeof propQuizId === 'number' },
    },
  );

  const { data: versionsRes, isLoading: versionsLoading } =
    useGetQuizVersions(effectiveQuizId);

  const latestVersion = useMemo(
    () => pickLatestQuizVersion(versionsRes),
    [versionsRes],
  );
  const latestQuizVersionId = useMemo(
    () => n((latestVersion as unknown as Record<string, unknown>)?.id),
    [latestVersion],
  );
  const latestVersionNumber = useMemo(
    () => n((latestVersion as unknown as Record<string, unknown>)?.version),
    [latestVersion],
  );

  useEffect(() => {
    if (!propQuizId) resetStore();
  }, [propQuizId, resetStore]);

  useEffect(() => {
    if (propQuizId && quizData && hydrated && step === 0) {
      hydrateFromServerQuiz(quizData as unknown);
    }
  }, [propQuizId, quizData, hydrateFromServerQuiz, hydrated, step]);

  useEffect(() => {
    if (typeof effectiveQuizId !== 'number') return;
    if (typeof quizVersionId === 'number') return;

    if (typeof latestQuizVersionId === 'number') {
      setQuizContext({
        quizId: effectiveQuizId,
        version:
          typeof latestVersionNumber === 'number' ? latestVersionNumber : 1,
        quizVersionId: latestQuizVersionId,
      });
    }
  }, [
    effectiveQuizId,
    quizVersionId,
    latestQuizVersionId,
    latestVersionNumber,
    setQuizContext,
  ]);

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
  const ensureUnpublishedVersion = useEnsureUnpublishedVersion(
    actions,
    latestVersion,
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Promise.resolve().then(() => setSubmitAttempted(false));
  }, [step]);

  useEffect(() => {
    const ensureVersion = async () => {
      if (typeof effectiveQuizId !== 'number' || !latestVersion || !quizData)
        return;
      const isPublished = Boolean(
        (latestVersion as unknown as Record<string, unknown>)?.publishedAt,
      );
      if (isPublished) {
        await ensureUnpublishedVersion(effectiveQuizId);
      }
    };

    ensureVersion();
  }, [effectiveQuizId, latestVersion, quizData, ensureUnpublishedVersion]);

  const traitIds = useMemo(
    () =>
      scales
        .map((s) => s.traitId)
        .filter((x): x is number => typeof x === 'number'),
    [scales],
  );

  const canGoNext = useMemo(() => {
    if (step === 0)
      return (
        Object.keys(
          validateInit({
            title: init.title,
            code: init.code,
            description: init.description,
          }),
        ).length === 0
      );
    if (step === 1)
      return (
        scales.length === 0 || Object.keys(validateScales(scales)).length === 0
      );
    if (step === 2)
      return Object.keys(validateQuestions(questions, traitIds)).length === 0;
    if (step === 3) return Object.keys(validateResults(results)).length === 0;
    return true;
  }, [
    step,
    init.title,
    init.code,
    init.description,
    scales,
    questions,
    traitIds,
    results,
  ]);

  const hasContext =
    typeof effectiveQuizId === 'number' && typeof quizVersionId === 'number';

  const goPrev = () => {
    setErrors({});
    setSubmitAttempted(false);
    setStep(Math.max(0, step - 1) as BuilderStep);
  };

  const goNext = async () => {
    let e: Record<string, string> = {};
    if (step === 0)
      e = validateInit({
        title: init.title,
        code: init.code,
        description: init.description,
      });
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

      setStep((step + 1) as BuilderStep);
      return;
    }

    if (step === 1) {
      if (scales.length > 0) {
        const ok = await ensureTraits();
        if (!ok) return;
      }
      setStep((step + 1) as BuilderStep);
      return;
    }

    if (step === 2) {
      setStep((step + 1) as BuilderStep);
      return;
    }

    if (step === 3) {
      const selectedCategoryId = Array.isArray(results.selectedCategoryIds)
        ? results.selectedCategoryIds[0]
        : undefined;

      if (
        typeof effectiveQuizId === 'number' &&
        typeof selectedCategoryId === 'number'
      ) {
        try {
          const versionOk = await ensureUnpublishedVersion(effectiveQuizId);
          if (!versionOk) return;

          await actions.updateQuiz.mutateAsync({
            id: effectiveQuizId,
            data: { categoryId: selectedCategoryId },
          });
        } catch (err) {
          const e = err as unknown;
          const msg =
            (e as { message?: string })?.message ??
            t('validation.quizOperationError');
          message.error(msg);
          return;
        }
      }

      setStep((step + 1) as BuilderStep);
      return;
    }

    setStep((step + 1) as BuilderStep);
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
  }, [step, router, t, resetStore]);

  const a = actions as ReturnTypeUseQuizBuilderActions | null;
  const traitsData: unknown = a?.quizTraits?.data ?? undefined;
  const questionsData: unknown = a?.quizQuestions?.data ?? undefined;

  useEffect(() => {
    try {
      const backendTraits = toArray<Record<string, unknown>>(
        traitsData as unknown,
      );
      if (typeof effectiveQuizId !== 'number' || backendTraits.length === 0)
        return;
      if (scales.length > 0) return;

      function lid(prefix: string) {
        return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
      }

      const scaleDrafts = backendTraits
        .flatMap((tr) => {
          const polarity = (tr?.polarity ??
            tr?.mode ??
            tr?.type ??
            'single') as 'single' | 'bipolar';

          if (polarity === 'bipolar') {
            const pairId = String(
              tr?.pairId ?? tr?.pairCode ?? tr?.bipolarPairCode ?? lid('pair'),
            );
            const pairCode = (tr?.pairCode ??
              tr?.bipolarPairCode ??
              '') as string;

            const left = (tr?.left ?? tr?.negative ?? tr?.a ?? {}) as Record<
              string,
              unknown
            >;
            const right = (tr?.right ?? tr?.positive ?? tr?.b ?? {}) as Record<
              string,
              unknown
            >;

            const leftTraitId = toNumber(
              left?.id ?? left?.traitId ?? tr?.leftTraitId,
            );
            const rightTraitId = toNumber(
              right?.id ?? right?.traitId ?? tr?.rightTraitId,
            );

            return [
              {
                tempId: lid('scale'),
                traitId: leftTraitId,
                polarity: 'bipolar',
                side: 'LEFT',
                pairId,
                bipolarPairCode: pairCode,
                name: (left?.name ??
                  left?.title ??
                  tr?.leftName ??
                  '') as string,
                code: (left?.code ?? tr?.leftCode ?? '') as string,
                description: (left?.description ??
                  tr?.leftDescription ??
                  '') as string,
                codeTouched: true,
              },
              {
                tempId: lid('scale'),
                traitId: rightTraitId,
                polarity: 'bipolar',
                side: 'RIGHT',
                pairId,
                bipolarPairCode: pairCode,
                name: (right?.name ??
                  right?.title ??
                  tr?.rightName ??
                  '') as string,
                code: (right?.code ?? tr?.rightCode ?? '') as string,
                description: (right?.description ??
                  tr?.rightDescription ??
                  '') as string,
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
              name: (tr?.name ?? tr?.title ?? '') as string,
              code: (tr?.code ?? '') as string,
              description: (tr?.description ?? '') as string,
              codeTouched: true,
            },
          ];
        })
        .filter(Boolean) as Array<Record<string, unknown>>;

      const detectedMode: 'single' | 'bipolar' | null = scaleDrafts.some(
        (s) => (s.polarity as string) === 'bipolar',
      )
        ? 'bipolar'
        : scaleDrafts.length > 0
          ? 'single'
          : null;

      if (scaleDrafts.length > 0) {
        setScales(scaleDrafts as ScaleDraft[]);
        if (detectedMode) setScaleMode(detectedMode);
      }
    } catch {
      /* ignore parse errors */
    }
  }, [traitsData, effectiveQuizId, scales.length, setScales, setScaleMode]);

  useEffect(() => {
    try {
      const backendQuestions = toArray<Record<string, unknown>>(
        questionsData as unknown,
      );
      if (typeof effectiveQuizId !== 'number' || backendQuestions.length === 0)
        return;
      if (
        questions.length > 0 &&
        questions.some(
          (q) =>
            typeof (q as unknown as Record<string, unknown>)?.questionId ===
            'number',
        )
      )
        return;

      function lid(prefix: string) {
        return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
      }

      const questionDrafts = backendQuestions
        .map((qq, idx) => {
          const qtype = (qq?.qtype ?? qq?.type ?? 'SINGLE_CHOICE') as string;
          const ord = toNumber(qq?.ord ?? qq?.order ?? qq?.position) ?? idx + 1;

          const opts = Array.isArray(qq?.options)
            ? (qq.options as unknown[])
            : ((qq?.answers ?? qq?.variants ?? []) as unknown[]);
          const optionDrafts = opts.map((o, oidx) => {
            const oRec = o as Record<string, unknown> | undefined;
            return {
              tempId: lid('opt'),
              ord:
                toNumber(oRec?.ord ?? oRec?.order ?? oRec?.position) ??
                oidx + 1,
              label: (oRec?.label ?? oRec?.text ?? oRec?.title ?? '') as string,
              optionId: toNumber(oRec?.id ?? oRec?.optionId),
              weightsByTraitId: normalizeWeights(
                oRec?.weightsByTraitId ??
                  oRec?.weights ??
                  oRec?.traitWeights ??
                  {},
              ),
            } as OptionDraft;
          });

          const qqRec = qq as Record<string, unknown> | undefined;
          const linkedTraitIdsRaw = Array.isArray(qqRec?.linkedTraitIds)
            ? ((qqRec!.linkedTraitIds as unknown[]).filter(
                (x) => typeof x === 'number',
              ) as number[])
            : Array.isArray(qqRec?.traitIds)
              ? ((qqRec!.traitIds as unknown[]).filter(
                  (x) => typeof x === 'number',
                ) as number[])
              : [];

          const derivedTraitIds = Array.from(
            new Set(
              optionDrafts
                .flatMap((o) =>
                  Object.keys(o.weightsByTraitId ?? {}).map((k) => Number(k)),
                )
                .filter((x) => Number.isFinite(x)),
            ),
          ).slice(0, 2) as number[];

          const linkedTraitIds = (
            linkedTraitIdsRaw.length > 0 ? linkedTraitIdsRaw : derivedTraitIds
          ).slice(0, 2) as number[];

          return {
            tempId: lid('q'),
            ord,
            qtype,
            text: (qqRec?.text ??
              qqRec?.title ??
              qqRec?.question ??
              '') as string,
            linkedTraitIds,
            questionId: toNumber(qqRec?.id ?? qqRec?.questionId),
            options:
              optionDrafts.length > 0
                ? optionDrafts
                : [
                    {
                      tempId: lid('opt'),
                      ord: 1,
                      label: '',
                      weightsByTraitId: {},
                    },
                  ],
          } as QuestionDraft;
        })
        .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));

      if (questionDrafts.length > 0)
        setQuestions(questionDrafts as QuestionDraft[]);
    } catch {
      /* ignore parse errors */
    }
  }, [
    questionsData,
    effectiveQuizId,
    questions.length,
    setQuestions,
    questions,
  ]);

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
