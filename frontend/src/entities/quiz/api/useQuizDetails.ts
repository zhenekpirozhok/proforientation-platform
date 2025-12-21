import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { orvalFetch } from "@/shared/api/orvalFetch";
import type { QuizDetailsDto } from "../model/quizDetails";

const quizDetailsQueryKey = (id: number) => ["quiz", id, "details"] as const;

function getQuizDetails(id: number, signal?: AbortSignal) {
    return orvalFetch<QuizDetailsDto>(`/quizzes/${id}/details`, {
        method: "GET",
        signal,
    });
}

export function useQuizDetails(
    id: number,
    options?: Omit<
        UseQueryOptions<
            QuizDetailsDto,
            Error,
            QuizDetailsDto,
            ReturnType<typeof quizDetailsQueryKey>
        >,
        "queryKey" | "queryFn"
    >
) {
    return useQuery({
        queryKey: quizDetailsQueryKey(id),
        queryFn: ({ signal }) => getQuizDetails(id, signal),
        enabled: Number.isFinite(id) && id > 0,
        ...options,
    });
}
