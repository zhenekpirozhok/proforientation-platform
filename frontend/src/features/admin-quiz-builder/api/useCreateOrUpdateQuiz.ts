'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { message } from 'antd';

import { useAdminQuizBuilderStore } from '../model/store';
import type { CreateQuizRequest, UpdateQuizRequest } from '@/shared/api/generated/model';
import type { ReturnTypeUseQuizBuilderActions } from './useQuizBuilderActions';

export function useCreateOrUpdateQuiz(actions: ReturnTypeUseQuizBuilderActions | null) {
    const t = useTranslations('AdminQuizBuilder');

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
                } else {
                    const response = await actions.createQuiz.mutateAsync({
                        data: payload as CreateQuizRequest,
                    });
                    const newQuizId = (response as any).id as number | undefined;

                    if (!newQuizId) {
                        message.error(t('validation.createQuizError'));
                        return false;
                    }

                    useAdminQuizBuilderStore.setState({
                        quizId: newQuizId,
                        version: 1,
                        quizVersionId: (response as any).quizVersionId as number | undefined,
                    });
                }

                return true;
            } catch (err) {
                message.error(t('validation.quizOperationError'));
                return false;
            }
        },
        [actions, t],
    );
}
