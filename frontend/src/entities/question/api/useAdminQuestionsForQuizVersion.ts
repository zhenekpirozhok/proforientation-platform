'use client';

import { useGetQuestionsForQuizVersion } from '@/shared/api/generated/api';
import type { GetQuestionsForQuizVersionParams } from '@/shared/api/generated/model';

export function useAdminQuestionsForQuizVersion(
  quizId?: number,
  version?: number,
  params?: GetQuestionsForQuizVersionParams,
) {
  const enabled =
    typeof quizId === 'number' &&
    quizId > 0 &&
    typeof version === 'number' &&
    version > 0;

  const defaults: GetQuestionsForQuizVersionParams = {
    page: String(1),
    size: String(200),
    sort: 'ord',
  };
  const finalParams = {
    ...(params ?? {}),
    ...defaults,
  } as GetQuestionsForQuizVersionParams;
  return useGetQuestionsForQuizVersion(
    enabled ? (quizId ?? 0) : 0,
    enabled ? (version ?? 0) : 0,
    finalParams,
    { query: { enabled } },
  );
}
