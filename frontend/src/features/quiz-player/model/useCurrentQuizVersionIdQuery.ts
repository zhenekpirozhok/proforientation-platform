import { useQuery } from "@tanstack/react-query";
import { getCurrentVersion } from "@/shared/api/generated/api";

export function useCurrentQuizVersionIdQuery(quizId: number) {
    return useQuery<number, Error>({
        queryKey: ["quiz", "versions", "current", quizId],
        enabled: Number.isFinite(quizId) && quizId > 0,
        queryFn: async ({ signal }) => {
            const dto = await getCurrentVersion(quizId, { signal });

            const id = Number(dto?.id);
            if (!Number.isFinite(id)) throw new Error("Current quiz version id is missing");

            return id;
        },
        staleTime: 60_000,
    });
}
