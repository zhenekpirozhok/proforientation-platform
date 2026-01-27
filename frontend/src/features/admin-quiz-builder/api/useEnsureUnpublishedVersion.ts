'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { useAdminQuizBuilderStore } from '../model/store';
import type { ReturnTypeUseQuizBuilderActions } from './useQuizBuilderActions';

function toId(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

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
  const ensuredForQuizRef = useRef<number | null>(null);
  const storeQuizVersionId = useAdminQuizBuilderStore((s) => s.quizVersionId);

  useEffect(() => {
    ensuredForQuizRef.current = null;
  }, [storeQuizVersionId]);

  return async (quizId: number): Promise<boolean> => {
    if (!actions) {
      message.error(t('validation.quizOperationError'));
      return false;
    }

    const id = toId(quizId);
    if (!id) {
      message.error(t('validation.quizOperationError'));
      return false;
    }

    try {
      const currentVersionPublished = isVersionPublished(latestVersion);

      if (!currentVersionPublished) return true;
      if (ensuredForQuizRef.current === id) return true;

      const res: unknown = await actions.copyLatestVersion.mutateAsync({
        id: id,
      });
      const { quizVersionId: newVersionId, version: newVersion } =
        pickVersionPayload(res);

      if (typeof newVersionId !== 'number') {
        message.error(t('validation.quizOperationError'));
        return false;
      }

      const prev = useAdminQuizBuilderStore.getState();
      const fallbackVersion =
        typeof newVersion === 'number'
          ? newVersion
          : ((prev.version as number | undefined) ?? 1) + 1;

      useAdminQuizBuilderStore.setState({
        quizVersionId: newVersionId,
        version: fallbackVersion,
        scales: prev.scales,
        questions: prev.questions,
        results: prev.results,
      });

      ensuredForQuizRef.current = id;

      qc.invalidateQueries();
      message.info(t('toastNewVersionCreated') || 'New version created');

      return true;
    } catch {
      message.error(t('validation.quizOperationError'));
      return false;
    }
  };
}
