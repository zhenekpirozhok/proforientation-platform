import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "@/shared/api/parseResponse";
import type { AttemptResult } from "../model/types";

export function useAttemptResultQuery(attemptId?: number | string, guestToken?: string) {
    return useQuery({
        queryKey: ["attempt", "result", attemptId],
        enabled: Boolean(attemptId) && Boolean(guestToken),
        queryFn: async () => {
            const res = await fetch(`/api/attempts/${attemptId}/result`, {
                method: "GET",
                headers: {
                    authorization: `Bearer ${guestToken}`,
                },
            });

            return parseResponse<AttemptResult>(res);
        },
    });
}
