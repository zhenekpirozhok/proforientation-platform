'use client';

import { useGetVersions as generatedUseGetVersions } from '@/shared/api/generated/api';
import type { UseQueryResult } from '@tanstack/react-query';
import type { QuizVersionDto } from '@/shared/api/generated/model';

export function useGetQuizVersions(
  id?: number,
): UseQueryResult<QuizVersionDto[] | undefined, unknown> {
  const enabled = typeof id === 'number' && Number.isFinite(id) && id > 0;
  return generatedUseGetVersions(enabled ? id : 0, {
    query: { enabled },
  }) as UseQueryResult<QuizVersionDto[] | undefined, unknown>;
}
