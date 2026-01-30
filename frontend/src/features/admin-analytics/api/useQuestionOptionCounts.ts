// src/features/admin-analytics/api/useQuestionOptionCounts.ts
'use client';

import useSWR from 'swr';
import { useQuizVersionNumber } from './useQuizVersionNumber';

type QuestionDto = {
  id: number;
  ord: number;
};

type Page<T> = { content: T[] };

const fetcher = async (url: string, locale?: string) => {
  const headers: Record<string, string> = {};
  if (locale) headers['x-locale'] = locale;

  const res = await fetch(url, { credentials: 'include', headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export function useQuestionOptionCounts(
  quizId: string,
  quizVersionId: string,
) {
  // 1) Resolve quizVersionId -> version number
  const versionRes = useQuizVersionNumber(quizId, quizVersionId);
  const versionNum = versionRes.data?.version;

  // 2) Use version number in the existing backend route
  const url =
    quizId && versionNum != null
      ? `/api/questions/quiz/${quizId}/version/${versionNum}?page=1&size=200&sort=ord`
      : null;

  const swr = useSWR<Record<number, number>>(
    url,
    async (u) => {
      const page = (await fetcher(u)) as Page<QuestionDto>;

      const pairs = await Promise.all(
        (page.content ?? []).map(async (q) => {
          const opts = (await fetcher(
            `/api/questions/${q.id}/options`,
          )) as Array<{ id: number }>;
          return [q.id, opts.length] as const;
        }),
      );

      return Object.fromEntries(pairs);
    },
    { revalidateOnFocus: false },
  );

  // 3) Merge loading/error so the UI behaves nicely
  return {
    data: swr.data,
    error: versionRes.error ?? swr.error,
    isLoading:
      versionRes.isLoading ||
      (versionNum == null && !versionRes.error) ||
      swr.isLoading,
    versionNum,
  };
}
