'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { useAdminQuizBuilderStore } from '../model/store';
import { useCreateQuizVersion } from '@/entities/quiz/api/useCreateQuizVersion';
import type { ReturnTypeUseQuizBuilderActions } from './useQuizBuilderActions';

function pickVersionPayload(res: unknown) {
  const r = res as Record<string, unknown> | undefined;
  const root = ((r?.data as Record<string, unknown> | undefined) ??
    (r?.result as Record<string, unknown> | undefined) ??
    (r?.payload as Record<string, unknown> | undefined) ??
    r ??
    {}) as Record<string, unknown>;

  const quizVersionId =
    typeof root.id === 'number'
      ? root.id
      : typeof root.quizVersionId === 'number'
        ? root.quizVersionId
        : undefined;

  const versionRaw = root.version;
  const version =
    typeof versionRaw === 'number'
      ? versionRaw
      : Number.isFinite(Number(versionRaw))
        ? Number(versionRaw)
        : undefined;

  return { quizVersionId, version };
}

function isVersionPublished(version: unknown): boolean {
  if (!version || typeof version !== 'object') return false;
  const v = version as Record<string, unknown>;
  return Boolean(v.publishedAt);
}

export function useEnsureUnpublishedVersion(
  actions: ReturnTypeUseQuizBuilderActions | null,
  latestVersion?: unknown,
) {
  const t = useTranslations('AdminQuizBuilder');
  const qc = useQueryClient();
  const createQuizVersion = useCreateQuizVersion();

  const ensuredForQuizRef = useRef<number | null>(null);
  const inFlightRef = useRef<Promise<boolean> | null>(null);

  return async (quizId: number): Promise<boolean> => {
    if (!actions) {
      message.error(t('validation.quizOperationError'));
      return false;
    }

    if (!isVersionPublished(latestVersion)) return true;

    if (ensuredForQuizRef.current === quizId) return true;

    if (inFlightRef.current) return inFlightRef.current;

    const run = (async () => {
      try {
        const newVersionRes: unknown = await createQuizVersion.mutateAsync(quizId);
        const { quizVersionId: newVersionId, version: newVersion } =
          pickVersionPayload(newVersionRes);

        if (typeof newVersionId !== 'number') {
          message.error(t('validation.quizOperationError'));
          return false;
        }

        const traitsData = actions.quizTraits?.data;
        const questionsData = actions.quizQuestions?.data;

        if (traitsData) {
          qc.setQueryData(
            [`/api/quiz-versions/${newVersionId}/traits`, newVersionId],
            traitsData,
          );
        }

        if (questionsData) {
          qc.setQueryData(
            [`/api/questions/quiz/${quizId}/version/${newVersion}`, quizId, newVersion],
            questionsData,
          );
        }

        const fallbackVersion =
          typeof newVersion === 'number'
            ? newVersion
            : ((((latestVersion as Record<string, unknown> | undefined)?.version as
              | number
              | undefined) ?? 1) + 1);

        const prevState = useAdminQuizBuilderStore.getState();
        useAdminQuizBuilderStore.setState({
          quizVersionId: newVersionId,
          version: fallbackVersion,
          scales: prevState.scales,
          questions: prevState.questions,
          results: prevState.results,
        });

        ensuredForQuizRef.current = quizId;

        message.info(t('toastNewVersionCreated') || 'New version created');
        return true;
      } catch {
        message.error(t('validation.quizOperationError'));
        return false;
      } finally {
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = run;
    return run;
  };
}
