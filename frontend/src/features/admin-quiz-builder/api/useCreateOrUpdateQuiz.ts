'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { message } from 'antd';

import { useAdminQuizBuilderStore } from '../model/store';
import type {
  CreateQuizRequest,
  UpdateQuizRequest,
} from '@/shared/api/generated/model';
import type { ReturnTypeUseQuizBuilderActions } from './useQuizBuilderActions';
import { useCreateQuizVersion } from '@/entities/quiz/api/useCreateQuizVersion';

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
  const createQuizVersion = useCreateQuizVersion();
  const newVersionCreatedRef = useRef(false);
  const storeQuizVersionId = useAdminQuizBuilderStore((s) => s.quizVersionId);

  // Reset the flag when quiz or version changes
  useEffect(() => {
    newVersionCreatedRef.current = false;
  }, [storeQuizVersionId]);

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

          // Check if current version is published and a new version hasn't been created yet
          const currentVersionPublished = isVersionPublished(latestVersion);

          if (currentVersionPublished && !newVersionCreatedRef.current) {
            try {
              // Create new version from the published one
              const newVersionRes: unknown =
                await createQuizVersion.mutateAsync(quizId);
              const { quizVersionId: newVersionId, version: newVersion } =
                pickVersionPayload(newVersionRes);

              if (typeof newVersionId !== 'number') {
                message.error(t('validation.quizOperationError'));
                return false;
              }

              // Update store with new version
              const fallbackVersion =
                typeof newVersion === 'number'
                  ? newVersion
                  : (((latestVersion as Record<string, unknown> | undefined)
                      ?.version as number | undefined) ?? 1 + 1);
              useAdminQuizBuilderStore.setState({
                quizVersionId: newVersionId,
                version: fallbackVersion,
              });

              newVersionCreatedRef.current = true;

              message.info(
                t('toastNewVersionCreated') || 'New version created',
              );
            } catch {
              message.error(t('validation.quizOperationError'));
              return false;
            }
          }

          await actions.updateQuiz.mutateAsync({
            id: quizId,
            data: updateData as UpdateQuizRequest,
          });
          return true;
        }

        const createdQuiz: unknown = await actions.createQuiz.mutateAsync({
          data: payload as CreateQuizRequest,
        });

        const newQuizId = (createdQuiz as Record<string, unknown>)?.id as
          | number
          | undefined;
        if (typeof newQuizId !== 'number') {
          message.error(t('validation.createQuizError'));
          return false;
        }

        const versionRes: unknown =
          await createQuizVersion.mutateAsync(newQuizId);
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

        return true;
      } catch {
        message.error(t('validation.quizOperationError'));
        return false;
      }
    },
    [actions, t, createQuizVersion, latestVersion],
  );
}
