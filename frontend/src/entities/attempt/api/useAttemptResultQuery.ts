import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "@/shared/api/parseResponse";
import type { AttemptResult } from "../model/types";

export function useAttemptResultQuery(
    attemptId?: number | string,
    guestToken?: string,
    locale?: string
) {
    return useQuery({
        queryKey: ["attempt", "result", attemptId, guestToken, locale],
        enabled: Boolean(attemptId) && Boolean(guestToken),
        queryFn: async () => {
            const res = await fetch(`/api/attempts/${attemptId}/result`, {
                method: "GET",
                headers: {
                    "x-guest-token": guestToken!,
                    ...(locale ? { "x-locale": locale } : {}),
                },
            });

            return parseResponse<AttemptResult>(res);
        },
        retry: false,
    });
}
