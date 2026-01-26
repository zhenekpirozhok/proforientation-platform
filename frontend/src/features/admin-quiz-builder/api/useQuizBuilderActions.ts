'use client';

import { useMemo } from 'react';

import { useAdminCreateQuiz } from '@/entities/quiz/api/useAdminCreateQuiz';
import { useAdminUpdateQuiz } from '@/entities/quiz/api/useAdminUpdateQuiz';
import { useAdminCopyLatestVersion } from '@/entities/quiz/api/useAdminCopyLatestVersion';
import { useAdminPublishQuiz } from '@/entities/quiz/api/useAdminPublishQuiz';
import {
  useCreateQuizVersion,
  type CreateQuizVersionVars,
} from '@/entities/quiz/api/useCreateQuizVersion';

import { useAdminCreateTrait } from '@/entities/trait/api/useAdminCreateTrait';

import { useAdminCreateQuestion } from '@/entities/question/api/useAdminCreateQuestion';
import { useAdminUpdateQuestion } from '@/entities/question/api/useAdminUpdateQuestion';
import { useDeleteQuestion } from '@/entities/question/api/useDeleteQuestion';
import { useUpdateQuestionOrder } from '@/entities/question/api/useUpdateQuestionOrder';

import { useAdminCreateOption } from '@/entities/option/api/useAdminCreateOption';
import { useAdminUpdateOption } from '@/entities/option/api/useAdminUpdateOption';
import { useAdminAssignOptionTraits } from '@/entities/option/api/useAdminAssignOptionTraits';
import { useAdminDeleteOption } from '@/entities/option/api/useAdminDeleteOption';

import { useAdminCreateCategory } from '@/entities/category/api/useAdminCreateCategory';
import { useAdminCreateProfession } from '@/entities/profession/api/useAdminCreateProfession';
import { useSearchProfessions } from '@/entities/profession/api/useSearchProfessions';

import { useQuizTraits } from '@/entities/quiz/api/useQuizTraits';
import { useAdminQuestionsForQuizVersion } from '@/entities/question/api/useAdminQuestionsForQuizVersion';

function toId(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function useQuizBuilderActions(
  quizId: number,
  quizVersionId: number,
  version?: number,
) {
  const createQuiz = useAdminCreateQuiz();
  const updateQuiz = useAdminUpdateQuiz();
  const copyLatestVersion = useAdminCopyLatestVersion();

  const publishBase = useAdminPublishQuiz();

  const createTrait = useAdminCreateTrait();

  const createQuestion = useAdminCreateQuestion(quizId, quizVersionId);
  const updateQuestion = useAdminUpdateQuestion(quizId, quizVersionId);
  const deleteQuestion = useDeleteQuestion();
  const updateQuestionOrder = useUpdateQuestionOrder();

  const createOption = useAdminCreateOption();
  const updateOption = useAdminUpdateOption();
  const assignOptionTraits = useAdminAssignOptionTraits();
  const deleteOption = useAdminDeleteOption();

  const createQuizVersionBase = useCreateQuizVersion();

  const createQuizVersion = useMemo(() => {
    return {
      ...createQuizVersionBase,
      mutateAsync: async (vars?: CreateQuizVersionVars, ...rest: unknown[]) => {
        const direct =
          typeof vars === 'number'
            ? vars
            : vars && typeof vars === 'object'
              ? (vars as Record<string, unknown>)?.id
              : undefined;

        const idToUse = toId(direct) ?? toId(quizId);
        if (!idToUse)
          throw new Error(`Invalid quiz id: ${String(direct ?? quizId)}`);

        return (
          createQuizVersionBase as unknown as {
            mutateAsync: (id: number, ...r: unknown[]) => Promise<unknown>;
          }
        ).mutateAsync(idToUse, ...rest);
      },
    } as typeof createQuizVersionBase;
  }, [createQuizVersionBase, quizId]);

  const createCategory = useAdminCreateCategory();
  const createProfession = useAdminCreateProfession();
  const searchProfessionsHook = useSearchProfessions;

  const quizTraits = useQuizTraits(quizVersionId);
  const quizQuestions = useAdminQuestionsForQuizVersion(quizId, version, {
    page: '1',
    size: '200',
    sort: 'ord',
  });

  const publishQuiz = useMemo(() => {
    return {
      ...publishBase,
      mutateAsync: async (vars: unknown, ...rest: unknown[]) => {
        const v = vars as Record<string, unknown> | undefined;
        const idToUse = toId(v?.id) ?? toId(quizVersionId);
        if (!idToUse)
          throw new Error(
            `Invalid quiz version id: ${String(v?.id ?? quizVersionId)}`,
          );
        return (
          publishBase as unknown as {
            mutateAsync: (
              payload: unknown,
              ...r: unknown[]
            ) => Promise<unknown>;
          }
        ).mutateAsync({ id: idToUse }, ...rest);
      },
    } as typeof publishBase;
  }, [publishBase, quizVersionId]);

  return {
    createQuiz,
    updateQuiz,
    copyLatestVersion,

    publishQuiz,

    createTrait,

    createQuestion,
    updateQuestion,
    deleteQuestion,
    updateQuestionOrder,

    createOption,
    updateOption,
    assignOptionTraits,
    deleteOption,

    createQuizVersion,

    createCategory,
    createProfession,

    quizTraits,
    quizQuestions,
    searchProfessionsHook,
  };
}

export type ReturnTypeUseQuizBuilderActions = ReturnType<
  typeof useQuizBuilderActions
>;
