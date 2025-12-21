import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "@/shared/api/parseResponse";
import type { AnswerPayload } from "../model/types";

type Args = {
    attemptId: number | string;
    guestToken: string;
    answer: AnswerPayload;
};

export function useSendAnswerMutation() {
    return useMutation({
        mutationFn: async ({ attemptId, guestToken, answer }: Args) => {
            const res = await fetch(`/api/attempts/${attemptId}/answers`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${guestToken}`,
                },
                body: JSON.stringify(answer),
            });

            return parseResponse<unknown>(res);
        },
    });
}
