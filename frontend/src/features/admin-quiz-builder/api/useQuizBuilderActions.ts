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
import { useSearchProfessions } from '@/entities/profession/api/useSearchProfessions';
import { useQuizTraits } from '@/entities/quiz/api/useQuizTraits';

export function useQuizBuilderActions(quizId: number, version: number) {
    const createQuiz = useAdminCreateQuiz();
    const updateQuiz = useAdminUpdateQuiz();
    const copyLatestVersion = useAdminCopyLatestVersion();
    const publish = useAdminPublishQuiz();

    const createTrait = useAdminCreateTrait();

    const createQuestion = useAdminCreateQuestion(quizId, version);
    const updateQuestion = useAdminUpdateQuestion(quizId, version);

    const createOption = useAdminCreateOption();
    const assignOptionTraits = useAdminAssignOptionTraits();

    const createCategory = useAdminCreateCategory();
    const createProfession = useAdminCreateProfession();

    const searchProfessionsHook = useSearchProfessions;
    const quizTraits = useQuizTraits(quizId);

    const publishQuiz = {
        ...publish,
        mutateAsync: async (vars: any, ...rest: any[]) => {
            const id = vars?.id;
            if (!Number.isFinite(Number(id))) {
                throw new Error('Invalid quiz id');
            }
            return publish.mutateAsync({ id: Number(id) }, ...rest);
        },
    } as typeof publish;

    return {
        createQuiz,
        updateQuiz,
        copyLatestVersion,
        publishQuiz,

        createTrait,

        createQuestion,
        updateQuestion,

        createOption,
        assignOptionTraits,

        createCategory,
        createProfession,
        quizTraits,

        searchProfessionsHook,
    };
}

export type ReturnTypeUseQuizBuilderActions = ReturnType<typeof useQuizBuilderActions>;
