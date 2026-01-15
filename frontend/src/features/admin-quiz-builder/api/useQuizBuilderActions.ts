'use client';

import { useMemo } from 'react';

import { useAdminCreateQuiz } from '@/entities/quiz/api/useAdminCreateQuiz';
import { useAdminUpdateQuiz } from '@/entities/quiz/api/useAdminUpdateQuiz';
import { useAdminCopyLatestVersion } from '@/entities/quiz/api/useAdminCopyLatestVersion';
import { useAdminPublishQuiz } from '@/entities/quiz/api/useAdminPublishQuiz';
import { useCreateQuizVersion, type CreateQuizVersionVars } from '@/entities/quiz/api/useCreateQuizVersion';

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

function toId(v: unknown): number | null {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
}

export function useQuizBuilderActions(quizId: number, quizVersionId: number) {
    const createQuiz = useAdminCreateQuiz();
    const updateQuiz = useAdminUpdateQuiz();
    const copyLatestVersion = useAdminCopyLatestVersion();

    const publishBase = useAdminPublishQuiz();

    const createTrait = useAdminCreateTrait();

    const createQuestion = useAdminCreateQuestion(quizId, quizVersionId);
    const updateQuestion = useAdminUpdateQuestion(quizId, quizVersionId);

    const createOption = useAdminCreateOption();
    const updateOption = useAdminUpdateOption();
    const assignOptionTraits = useAdminAssignOptionTraits();

    const createQuizVersionBase = useCreateQuizVersion();

    const createQuizVersion = useMemo(() => {
        return {
            ...createQuizVersionBase,
            mutateAsync: async (vars?: CreateQuizVersionVars, ...rest: any[]) => {
                const direct =
                    typeof vars === 'number'
                        ? vars
                        : vars && typeof vars === 'object'
                            ? (vars as any).id
                            : undefined;

                const idToUse = toId(direct) ?? toId(quizId);

                if (!idToUse) throw new Error(`Invalid quiz id: ${String(direct ?? quizId)}`);

                return (createQuizVersionBase as any).mutateAsync(idToUse, ...rest);
            },
        } as typeof createQuizVersionBase;
    }, [createQuizVersionBase, quizId]);

    const createCategory = useAdminCreateCategory();
    const createProfession = useAdminCreateProfession();
    const searchProfessionsHook = useSearchProfessions;

    const quizTraits = useQuizTraits(quizId);

    const publishQuiz = useMemo(() => {
        return {
            ...publishBase,
            mutateAsync: async (vars: any, ...rest: any[]) => {
                const idToUse = toId(vars?.id) ?? toId(quizId);
                if (!idToUse) throw new Error(`Invalid quiz id: ${String(vars?.id ?? quizId)}`);
                return publishBase.mutateAsync({ id: idToUse } as any, ...rest);
            },
        } as typeof publishBase;
    }, [publishBase, quizId]);

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

        createQuizVersion,

        createCategory,
        createProfession,

        quizTraits,
        searchProfessionsHook,
    };
}

export type ReturnTypeUseQuizBuilderActions = ReturnType<typeof useQuizBuilderActions>;
