import { useQuery } from '@tanstack/react-query';
import { orvalFetch } from '@/shared/api/orvalFetch';
import type { TraitDto } from '@/shared/api/generated/model';

export function buildQuizTraitsUrl(quizVersionId: number) {
    return `/api/quiz-versions/${quizVersionId}/traits`;
}

export function useQuizTraits(quizVersionId?: number) {
    const enabled = typeof quizVersionId === 'number' && Number.isFinite(quizVersionId) && quizVersionId > 0;
    const url = enabled ? buildQuizTraitsUrl(quizVersionId as number) : '/api/quiz-versions/0/traits';

    return useQuery<TraitDto[]>({
        queryKey: [url, quizVersionId],
        queryFn: ({ signal }) => orvalFetch<TraitDto[]>(url, { method: 'GET', signal }),
        enabled,
    });
}
