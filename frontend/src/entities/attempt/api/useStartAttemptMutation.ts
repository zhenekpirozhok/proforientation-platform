import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "@/shared/api/parseResponse";
import type { StartAttemptResponse } from "../model/types";

export type StartAttemptParams = {
    quizVersionId: number;
    locale?: string;
};

export function useStartAttemptMutation() {
    return useMutation({
        mutationFn: async ({ quizVersionId, locale }: StartAttemptParams) => {
            const sp = new URLSearchParams({ quizVersionId: String(quizVersionId) });

            const res = await fetch(`/api/attempts/start?${sp.toString()}`, {
                method: "POST",
                headers: locale ? { "x-locale": locale } : undefined,
            });

            return parseResponse<StartAttemptResponse>(res);
        },
        retry: false,
    });
}
