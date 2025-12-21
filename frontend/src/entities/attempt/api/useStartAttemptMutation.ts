import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "@/shared/api/parseResponse";
import type { StartAttemptResponse } from "../model/types";

export type StartAttemptParams = {
    quizVersionId: number;
};

export function useStartAttemptMutation() {
    return useMutation({
        mutationFn: async ({ quizVersionId }: StartAttemptParams) => {
            const sp = new URLSearchParams({ quizVersionId: String(quizVersionId) });

            const res = await fetch(`/api/attempts/start?${sp.toString()}`, {
                method: "POST",
            });

            return parseResponse<StartAttemptResponse>(res);
        },
    });
}
