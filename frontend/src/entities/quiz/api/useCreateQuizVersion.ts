'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { orvalFetch } from '@/shared/api/orvalFetch';

export type CreateQuizVersionVars = { id: number } | number;

function normalizeId(vars: CreateQuizVersionVars): number {
  const id = typeof vars === 'number' ? vars : vars.id;
  if (!Number.isFinite(Number(id)) || Number(id) <= 0) {
    throw new Error(`Invalid quiz id: ${String(id)}`);
  }
  return Number(id);
}

async function createQuizVersionApi(id: number): Promise<unknown> {
  return orvalFetch(`/quizzes/${id}/versions`, { method: 'POST' });
}

export const useCreateQuizVersion = (): UseMutationResult<
  unknown,
  unknown,
  CreateQuizVersionVars,
  unknown
> => {
  return useMutation({
    mutationFn: (vars) => createQuizVersionApi(normalizeId(vars)),
  });
};
