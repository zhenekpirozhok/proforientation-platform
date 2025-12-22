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
            const res = await fetch(`/api/attempts/${attemptId}/answers/bulk`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${guestToken}`,
                    "x-guest-token": guestToken,
                    ...(locale ? { "x-locale": locale } : {}),
                },
                body: JSON.stringify({ optionIds }),
            });

            return parseResponse<unknown>(res);
        },
    });
}
