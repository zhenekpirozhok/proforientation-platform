'use client';

import { useAdminCreateQuiz } from '@/entities/quiz/api/useAdminCreateQuiz';
import { useAdminUpdateQuiz } from '@/entities/quiz/api/useAdminUpdateQuiz';
import { useAdminCopyLatestVersion } from '@/entities/quiz/api/useAdminCopyLatestVersion';
import { useAdminPublishQuiz } from '@/entities/quiz/api/useAdminPublishQuiz';
import { useCreateQuizVersion } from '@/entities/quiz/api/useCreateQuizVersion';

import { useAdminCreateTrait } from '@/entities/trait/api/useAdminCreateTrait';

import { useAdminCreateQuestion } from '@/entities/question/api/useAdminCreateQuestion';
import { useAdminUpdateQuestion } from '@/entities/question/api/useAdminUpdateQuestion';

import { useAdminCreateOption } from '@/entities/option/api/useAdminCreateOption';
import { useAdminUpdateOption } from '@/entities/option/api/useAdminUpdateOption';
import { useAdminAssignOptionTraits } from '@/entities/option/api/useAdminAssignOptionTraits';

import { useAdminCreateCategory } from '@/entities/category/api/useAdminCreateCategory';
import { useAdminCreateProfession } from '@/entities/profession/api/useAdminCreateProfession';
import { useSearchProfessions } from '@/entities/profession/api/useSearchProfessions';
import { useQuizTraits } from '@/entities/quiz/api/useQuizTraits';

export function useQuizBuilderActions(quizId: number, quizVersionId: number) {
    const createQuiz = useAdminCreateQuiz();
    const updateQuiz = useAdminUpdateQuiz();
    const copyLatestVersion = useAdminCopyLatestVersion();
    const publish = useAdminPublishQuiz();

    const createTrait = useAdminCreateTrait();

    const createQuestion = useAdminCreateQuestion(quizId, quizVersionId);
    const updateQuestion = useAdminUpdateQuestion(quizId, quizVersionId);

    const createOption = useAdminCreateOption();
    const updateOption = useAdminUpdateOption();
    const assignOptionTraits = useAdminAssignOptionTraits();

    const createQuizVersion = useCreateQuizVersion();

    const createQuizVersionWithContext = {
        ...createQuizVersion,
        mutateAsync: async (maybeQuizId?: number, ...rest: any[]) => {
            const idToUse = Number.isFinite(Number(maybeQuizId)) ? Number(maybeQuizId) : Number(quizId);
            if (!Number.isFinite(idToUse) || idToUse <= 0) throw new Error('Invalid quiz id');
            return (createQuizVersion as any).mutateAsync(idToUse, ...rest);
        },
    } as typeof createQuizVersion;

    const createCategory = useAdminCreateCategory();
    const createProfession = useAdminCreateProfession();

    const searchProfessionsHook = useSearchProfessions;
    const quizTraits = useQuizTraits(quizId);

    const publishQuiz = {
        ...publish,
        mutateAsync: async (vars: any, ...rest: any[]) => {
            const id = Number(vars?.id);
            if (!Number.isFinite(id) || id <= 0) throw new Error('Invalid quiz id');
            return publish.mutateAsync({ id }, ...rest);
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
        updateOption,
        assignOptionTraits,

        createQuizVersion: createQuizVersionWithContext,

        createCategory,
        createProfession,

        quizTraits,
        searchProfessionsHook,
    };
}

export type ReturnTypeUseQuizBuilderActions = ReturnType<typeof useQuizBuilderActions>;
