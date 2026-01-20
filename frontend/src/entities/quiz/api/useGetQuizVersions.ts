'use client';

import { useGetVersions as generatedUseGetVersions } from '@/shared/api/generated/api';
import type { UseQueryResult } from '@tanstack/react-query';
import type { QuizVersionDto } from '@/shared/api/generated/model';

export function useGetQuizVersions(
    id?: string | number,
): UseQueryResult<QuizVersionDto[] | undefined, unknown> {
    const num = typeof id === 'string' ? Number(id) : id;
    const enabled = typeof num === 'number' && Number.isFinite(num) && num > 0;
    return generatedUseGetVersions(enabled ? num : 0, {
        query: { enabled },
    }) as UseQueryResult<QuizVersionDto[] | undefined, unknown>;
}
