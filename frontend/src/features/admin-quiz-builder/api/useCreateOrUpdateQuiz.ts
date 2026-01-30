'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { useAdminQuizBuilderStore } from '../model/store';
import type {
  CreateQuizRequest,
  UpdateQuizRequest,
} from '@/shared/api/generated/model';
import type { ReturnTypeUseQuizBuilderActions } from './useQuizBuilderActions';

import {
  getGetById1QueryKey,
  getGetVersionsQueryKey,
} from '@/shared/api/generated/api';

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

export function useCreateOrUpdateQuiz(
  actions: ReturnTypeUseQuizBuilderActions | null,
  latestVersion?: unknown,
) {
  const t = useTranslations('AdminQuizBuilder');
  const qc = useQueryClient();
  const ensuredForQuizRef = useRef<number | null>(null);

  return useCallback(
    async (
      payload: CreateQuizRequest | (UpdateQuizRequest & { quizId?: number }),
      isUpdate = false,
    ) => {
      if (!actions) {
        message.error(t('validation.quizOperationError'));
        return false;
      }

      try {
        if (
          isUpdate &&
          'quizId' in payload &&
          typeof payload.quizId === 'number'
        ) {
          const { quizId, ...updateData } = payload;

          const currentVersionPublished = isVersionPublished(latestVersion);

          if (currentVersionPublished && ensuredForQuizRef.current !== quizId) {
            const newVersionRes = await actions.copyLatestVersion.mutateAsync({
              id: quizId,
            });

            const { quizVersionId, version } =
              pickVersionPayload(newVersionRes);

            if (typeof quizVersionId !== 'number') {
              message.error(t('validation.quizOperationError'));
              return false;
            }

            const fallbackVersion =
              typeof version === 'number'
                ? version
                : (((latestVersion as Record<string, unknown> | undefined)
                    ?.version as number | undefined) ?? 1) + 1;

            const prevState = useAdminQuizBuilderStore.getState();
            useAdminQuizBuilderStore.setState({
              quizVersionId,
              version: fallbackVersion,
              scales: prevState.scales,
              questions: prevState.questions,
              results: prevState.results,
            });

            ensuredForQuizRef.current = quizId;

            qc.invalidateQueries({ queryKey: getGetVersionsQueryKey(quizId) });
            qc.invalidateQueries({ queryKey: getGetById1QueryKey(quizId) });
            qc.invalidateQueries({ queryKey: ['/quizzes/my'] });

            message.info(t('toastNewVersionCreated'));
          }

          await actions.updateQuiz.mutateAsync({
            id: quizId,
            data: updateData as UpdateQuizRequest,
          });

          qc.invalidateQueries({ queryKey: getGetById1QueryKey(quizId) });
          qc.invalidateQueries({ queryKey: ['/quizzes/my'] });

          return true;
        }

        const createdQuiz = await actions.createQuiz.mutateAsync({
          data: payload as CreateQuizRequest,
        });

        const newQuizId = (createdQuiz as Record<string, unknown>)?.id as
          | number
          | undefined;

        if (typeof newQuizId !== 'number') {
          message.error(t('validation.createQuizError'));
          return false;
        }

        const versionRes =
          await actions.createQuizVersion.mutateAsync(newQuizId);

        const { quizVersionId, version } = pickVersionPayload(versionRes);

        if (typeof quizVersionId !== 'number') {
          message.error(t('validation.quizOperationError'));
          return false;
        }

        useAdminQuizBuilderStore.setState({
          quizId: newQuizId,
          quizVersionId,
          version: typeof version === 'number' ? version : 1,
          step: 0,
        });

        qc.invalidateQueries({ queryKey: ['/quizzes/my'] });
        qc.invalidateQueries({ queryKey: getGetById1QueryKey(newQuizId) });
        qc.invalidateQueries({ queryKey: getGetVersionsQueryKey(newQuizId) });

        return true;
      } catch {
        message.error(t('validation.quizOperationError'));
        return false;
      }
    },
    [actions, latestVersion, qc, t],
  );
}
