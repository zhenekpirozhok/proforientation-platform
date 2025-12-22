import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "@/shared/api/parseResponse";
import type { AnswerPayload } from "../model/types";

type Args = {
    attemptId: number | string;
    guestToken: string;
    answer: AnswerPayload;
    locale?: string;
};

export function useSendAnswerMutation() {
    return useMutation({
        mutationFn: async ({ attemptId, guestToken, answer, locale }: Args) => {
            const res = await fetch(`/api/attempts/${attemptId}/answers`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-guest-token": guestToken,
                    ...(locale ? { "x-locale": locale } : {}),
                },
                body: JSON.stringify({ optionId: answer.optionId }),
            });

            return parseResponse<unknown>(res);
        },
    });
}
