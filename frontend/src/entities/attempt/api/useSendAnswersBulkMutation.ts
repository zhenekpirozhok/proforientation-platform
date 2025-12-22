import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "@/shared/api/parseResponse";

type Args = {
    attemptId: number | string;
    guestToken: string;
    optionIds: number[];
    locale?: string;
};

export function useSendAnswersBulkMutation() {
    return useMutation({
        mutationFn: async ({ attemptId, guestToken, optionIds, locale }: Args) => {
            if (!guestToken) throw new Error("Missing guestToken");
            if (!Array.isArray(optionIds) || optionIds.length === 0) {
                throw new Error("optionIds must be a non-empty array");
            }

            const headers: Record<string, string> = {
                "content-type": "application/json",
                "x-guest-token": guestToken,
            };
            if (locale) headers["x-locale"] = locale;

            const res = await fetch(`/api/attempts/${attemptId}/answers/bulk`, {
                method: "POST",
                headers,
                body: JSON.stringify({ optionIds }),
            });

            return parseResponse<unknown>(res);
        },
    });
}
