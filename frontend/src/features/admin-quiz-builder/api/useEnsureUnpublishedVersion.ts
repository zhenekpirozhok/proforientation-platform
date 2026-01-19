'use client';

import { useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { message } from 'antd';

import { useAdminQuizBuilderStore } from '../model/store';
import { useCreateQuizVersion } from '@/entities/quiz/api/useCreateQuizVersion';
import type { ReturnTypeUseQuizBuilderActions } from './useQuizBuilderActions';

function pickVersionPayload(res: any) {
    const root = res?.data ?? res?.result ?? res?.payload ?? res;
    const quizVersionId =
        typeof root?.id === 'number'
            ? root.id
            : typeof root?.quizVersionId === 'number'
                ? root.quizVersionId
                : undefined;

    const version =
        typeof root?.version === 'number'
            ? root.version
            : Number.isFinite(Number(root?.version))
                ? Number(root.version)
                : undefined;

    return { quizVersionId, version };
}

function isVersionPublished(version: any): boolean {
    const publishedAt = version?.publishedAt;
    return Boolean(publishedAt);
}

export function useEnsureUnpublishedVersion(
    actions: ReturnTypeUseQuizBuilderActions | null,
    latestVersion?: any,
) {
    const t = useTranslations('AdminQuizBuilder');
    const createQuizVersion = useCreateQuizVersion();
    const newVersionCreatedRef = useRef(false);
    const storeQuizVersionId = useAdminQuizBuilderStore((s) => s.quizVersionId);

    // Reset the flag when quiz or version changes
    useEffect(() => {
        newVersionCreatedRef.current = false;
    }, [storeQuizVersionId]);

    return async (quizId: number): Promise<boolean> => {
        if (!actions) {
            message.error(t('validation.quizOperationError'));
            return false;
        }

        try {
            // Check if current version is published and a new version hasn't been created yet
            const currentVersionPublished = isVersionPublished(latestVersion);

            if (currentVersionPublished && !newVersionCreatedRef.current) {
                try {
                    // Create new version from the published one
                    const newVersionRes: any = await createQuizVersion.mutateAsync(quizId);
                    const { quizVersionId: newVersionId, version: newVersion } = pickVersionPayload(newVersionRes);

                    if (typeof newVersionId !== 'number') {
                        message.error(t('validation.quizOperationError'));
                        return false;
                    }

                    // Update store with new version
                    useAdminQuizBuilderStore.setState({
                        quizVersionId: newVersionId,
                        version: typeof newVersion === 'number' ? newVersion : (latestVersion?.version ?? 1) + 1,
                    });

                    newVersionCreatedRef.current = true;

                    message.info(t('toastNewVersionCreated') || 'New version created');
                } catch (err) {
                    message.error(t('validation.quizOperationError'));
                    return false;
                }
            }

            return true;
        } catch (err) {
            message.error(t('validation.quizOperationError'));
            return false;
        }
    };
}
