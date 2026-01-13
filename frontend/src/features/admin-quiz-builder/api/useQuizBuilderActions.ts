'use client';

import { useAdminCreateQuiz } from '@/entities/quiz/api/useAdminCreateQuiz';
import { useAdminUpdateQuiz } from '@/entities/quiz/api/useAdminUpdateQuiz';
import { useAdminCopyLatestVersion } from '@/entities/quiz/api/useAdminCopyLatestVersion';
import { useAdminPublishQuiz } from '@/entities/quiz/api/useAdminPublishQuiz';
import { useAdminCreateTrait } from '@/entities/trait/api/useAdminCreateTrait';

import { useAdminCreateQuestion } from '@/entities/question/api/useAdminCreateQuestion';
import { useAdminUpdateQuestion } from '@/entities/question/api/useAdminUpdateQuestion';

import { useAdminCreateOption } from '@/entities/option/api/useAdminCreateOption';
import { useAdminAssignOptionTraits } from '@/entities/option/api/useAdminAssignOptionTraits';

import { useAdminCreateCategory } from '@/entities/category/api/useAdminCreateCategory';
import { useAdminCreateProfession } from '@/entities/profession/api/useAdminCreateProfession';

export function useQuizBuilderActions(quizId: number, version: number) {
    return {
        createQuiz: useAdminCreateQuiz(),
        updateQuiz: useAdminUpdateQuiz(),
        copyLatestVersion: useAdminCopyLatestVersion(),
        publishQuiz: useAdminPublishQuiz(),

        createTrait: useAdminCreateTrait(),

        createQuestion: useAdminCreateQuestion(quizId, version),
        updateQuestion: useAdminUpdateQuestion(quizId, version),

        createOption: useAdminCreateOption(),
        assignOptionTraits: useAdminAssignOptionTraits(),

        createCategory: useAdminCreateCategory(),
        createProfession: useAdminCreateProfession(),
    };
}

export type ReturnTypeUseQuizBuilderActions = ReturnType<typeof useQuizBuilderActions>;
