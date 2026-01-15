'use client';

import { useCallback } from 'react';
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

export function useCreateOrUpdateQuiz(actions: ReturnTypeUseQuizBuilderActions | null) {
    const t = useTranslations('AdminQuizBuilder');
    const createQuizVersion = useCreateQuizVersion();

    return useCallback(
        async (
            payload: CreateQuizRequest | (UpdateQuizRequest & { quizId?: number }),
            isUpdate: boolean = false,
        ) => {
            if (!actions) {
                message.error(t('validation.quizOperationError'));
                return false;
            }

            try {
                if (isUpdate && 'quizId' in payload && payload.quizId) {
                    const { quizId, ...updateData } = payload;
                    await actions.updateQuiz.mutateAsync({
                        id: quizId,
                        data: updateData as UpdateQuizRequest,
                    });
                    return true;
                }

                const createdQuiz: any = await actions.createQuiz.mutateAsync({
                    data: payload as CreateQuizRequest,
                });

                const newQuizId = createdQuiz?.id as number | undefined;

                if (typeof newQuizId !== 'number') {
                    message.error(t('validation.createQuizError'));
                    return false;
                }

                useAdminQuizBuilderStore.setState({
                    quizId: newQuizId,
                    version: undefined,
                    quizVersionId: undefined,
                });

                const versionRes: any = await createQuizVersion.mutateAsync({ quizId: newQuizId } as any);

                const { quizVersionId, version } = pickVersionPayload(versionRes);

                if (typeof quizVersionId !== 'number') {
                    message.error(t('validation.quizOperationError'));
                    return false;
                }

                useAdminQuizBuilderStore.setState({
                    quizId: newQuizId,
                    quizVersionId: quizVersionId,
                    version: typeof version === 'number' ? version : 1,
                });

                return true;
            } catch (err) {
                message.error(t('validation.quizOperationError'));
                return false;
            }
        },
        [actions, t, createQuizVersion],
    );
}
