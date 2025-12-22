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
            if (!guestToken) throw new Error("Missing guestToken");
            if (!answer?.optionId) throw new Error("Missing optionId");

            const headers: Record<string, string> = {
                "content-type": "application/json",
                "x-guest-token": guestToken,
            };
            if (locale) headers["x-locale"] = locale;

            const res = await fetch(`/api/attempts/${attemptId}/answers`, {
                method: "POST",
                headers,
                body: JSON.stringify(answer),
            });

            return parseResponse<unknown>(res);
        },
    });
}
