// src/features/admin-analytics/api/useQuestionOptionCounts.ts
'use client';

import useSWR from 'swr';

type QuestionDto = {
  id: number;
  ord: number;
};

type Page<T> = { content: T[] };

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export function useQuestionOptionCounts(
  locale: string,
  quizId: string,
  quizVersionId: string,
) {
  const url =
    quizId && quizVersionId
      ? `/${locale}/api/questions/quiz/${quizId}/version/${quizVersionId}?page=1&size=200&sort=ord`
      : null;

  return useSWR<Record<number, number>>(
    url,
    async (u) => {
      const page = (await fetcher(u)) as Page<QuestionDto>;

      // Now fetch options count per question using /questions/{questionId}/options
      const pairs = await Promise.all(
        (page.content ?? []).map(async (q) => {
          const opts = (await fetcher(
            `/${locale}/api/questions/${q.id}/options`,
          )) as Array<{ id: number }>;
          return [q.id, opts.length] as const;
        }),
      );

      return Object.fromEntries(pairs);
    },
    { revalidateOnFocus: false },
  );
}
