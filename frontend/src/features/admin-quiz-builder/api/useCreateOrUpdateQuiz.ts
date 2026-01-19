'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { message } from 'antd';

import { useAdminQuizBuilderStore } from '../model/store';
import type { CreateQuizRequest, UpdateQuizRequest } from '@/shared/api/generated/model';
import type { ReturnTypeUseQuizBuilderActions } from './useQuizBuilderActions';
import { useCreateQuizVersion } from '@/entities/quiz/api/useCreateQuizVersion';

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

export function useCreateOrUpdateQuiz(
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

    return useCallback(
        async (payload: CreateQuizRequest | (UpdateQuizRequest & { quizId?: number }), isUpdate = false) => {
            if (!actions) {
                message.error(t('validation.quizOperationError'));
                return false;
            }

            try {
                if (isUpdate && 'quizId' in payload && typeof payload.quizId === 'number') {
                    const { quizId, ...updateData } = payload;

                    // Check if current version is published and a new version hasn't been created yet
                    const currentVersionPublished = isVersionPublished(latestVersion);
                    const currentQuizVersionId = useAdminQuizBuilderStore.getState().quizVersionId;

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

                    await actions.updateQuiz.mutateAsync({
                        id: quizId,
                        data: updateData as UpdateQuizRequest,
                    });
                    return true;
                }

                const createdQuiz: any = await actions.createQuiz.mutateAsync({
                    data: payload as CreateQuizRequest,
                });

                const newQuizId = createdQuiz?.id;
                if (typeof newQuizId !== 'number') {
                    message.error(t('validation.createQuizError'));
                    return false;
                }

                const versionRes: any = await createQuizVersion.mutateAsync(newQuizId);
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
            } catch (err) {
                message.error(t('validation.quizOperationError'));
                return false;
            }
        },
        [actions, t, createQuizVersion, latestVersion],
    );
}
