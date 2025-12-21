import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "@/shared/api/parseResponse";
import type { AnswerPayload } from "../model/types";

type Args = {
    attemptId: number | string;
    guestToken: string;
    answers: AnswerPayload[];
};

export function useSendAnswersBulkMutation() {
    return useMutation({
        mutationFn: async ({ attemptId, guestToken, answers }: Args) => {
            const res = await fetch(`/api/attempts/${attemptId}/answers/bulk`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${guestToken}`,
                },
                body: JSON.stringify(answers),
            });

            return parseResponse<unknown>(res);
        },
    });
}
