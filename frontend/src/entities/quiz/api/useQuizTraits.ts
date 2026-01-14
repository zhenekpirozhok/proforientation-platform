import { useQuery } from '@tanstack/react-query';
import { orvalFetch } from '@/shared/api/orvalFetch';
import type { TraitDto } from '@/shared/api/generated/model';

export function buildQuizTraitsUrl(quizId: number) {
    return `/quizzes/${quizId}/traits`;
}

export function useQuizTraits(quizId: number) {
    const url = buildQuizTraitsUrl(quizId);

    return useQuery<TraitDto[]>({
        queryKey: [url, quizId],
        queryFn: ({ signal }) => orvalFetch<TraitDto[]>(url, { method: 'GET', signal }),
    });
}
