import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "@/shared/api/parseResponse";

type Args = {
    attemptId: number | string;
    guestToken: string;
    locale?: string;
};

export function useSubmitAttemptMutation() {
    return useMutation({
        mutationFn: async ({ attemptId, guestToken, locale }: Args) => {
            const res = await fetch(`/api/attempts/${attemptId}/submit`, {
                method: "POST",
                headers: {
                    "x-guest-token": guestToken,
                    ...(locale ? { "x-locale": locale } : {}),
                },
            });

            return parseResponse<unknown>(res);
        },
    });
}
