import { useQuery } from '@tanstack/react-query';
import { orvalFetch } from '@/shared/api/orvalFetch';
import type { TraitDto } from '@/shared/api/generated/model';

export function buildQuizTraitsUrl(quizVersionId: number) {
    return `/quizzes/${quizVersionId}/traits`;
}

export function useQuizTraits(quizVersionId?: number) {
    const enabled = typeof quizVersionId === 'number' && Number.isFinite(quizVersionId) && quizVersionId > 0;
    const url = enabled ? buildQuizTraitsUrl(quizVersionId as number) : `/quizzes/disabled/traits`;

    return useQuery<TraitDto[]>({
        queryKey: [url, quizVersionId],
        queryFn: ({ signal }) => orvalFetch<TraitDto[]>(url, { method: 'GET', signal }),
        enabled,
    });
}
