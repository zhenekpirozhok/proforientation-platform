import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { Question } from '../model/types';
import { quizQuestionPageKey } from './queryKeys';

import { getQuestionsForQuiz } from '@/shared/api/generated/api';

type Params = {
  quizId: number;
  page: number;
  locale: string;
};

export function useQuizQuestionPageQuery({ quizId, page, locale }: Params) {
  return useQuery({
    queryKey: quizQuestionPageKey(quizId, page, locale),
    enabled:
      Number.isFinite(quizId) && quizId > 0 && page >= 0 && Boolean(locale),

    queryFn: async ({ signal }) => {
      const raw = await getQuestionsForQuiz(quizId, { page, size: 1 } as any, {
        signal,
        headers: {
          'x-locale': locale,
        },
      });

      const data = raw as any;

      if (Array.isArray(data)) {
        return {
          question: (data[0] ?? null) as Question | null,
          total: data.length,
        };
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      const question = (content[0] ?? null) as Question | null;
      const total =
        typeof data?.totalElements === 'number'
          ? data.totalElements
          : undefined;

      return { question, total };
    },

    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
