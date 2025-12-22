import { useQuery } from "@tanstack/react-query";

type CurrentVersionDto = { id?: number };

export function useCurrentQuizVersionIdQuery(quizId: number) {
    return useQuery<number, Error>({
        queryKey: ["quiz", "versions", "current", quizId],
        enabled: Number.isFinite(quizId) && quizId > 0,
        queryFn: async () => {
            const res = await fetch(`/api/quizzes/${quizId}/versions/current`, { method: "GET" });
            const text = await res.text();

            if (!res.ok) throw new Error(text || "Failed to load current quiz version");

            const json = text ? (JSON.parse(text) as CurrentVersionDto) : null;
            const id = Number(json?.id);

            if (!Number.isFinite(id)) throw new Error("Current quiz version id is missing");
            return id;
        },
        staleTime: 60_000,
    });
}
