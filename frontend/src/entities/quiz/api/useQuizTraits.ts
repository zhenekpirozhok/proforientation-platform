import { useQuery } from '@tanstack/react-query';
import { orvalFetch } from '@/shared/api/orvalFetch';
import type { TraitDto } from '@/shared/api/generated/model';

export function buildQuizTraitsUrl(quizId: number) {
    return `/quizzes/${quizId}/traits`;
}

export function useQuizTraits(quizId?: number) {
    const enabled = typeof quizId === 'number' && Number.isFinite(quizId) && quizId > 0;
    const url = enabled ? buildQuizTraitsUrl(quizId as number) : `/quizzes/disabled/traits`;

    return useQuery<TraitDto[]>({
        queryKey: [url, quizId],
        queryFn: ({ signal }) => orvalFetch<TraitDto[]>(url, { method: 'GET', signal }),
        enabled,
    });
}
