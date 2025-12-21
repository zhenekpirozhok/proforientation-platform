import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "@/shared/api/parseResponse";

type Args = {
    attemptId: number | string;
    guestToken: string;
};

export function useSubmitAttemptMutation() {
    return useMutation({
        mutationFn: async ({ attemptId, guestToken }: Args) => {
            const res = await fetch(`/api/attempts/${attemptId}/submit`, {
                method: "POST",
                headers: {
                    authorization: `Bearer ${guestToken}`,
                },
            });

            return parseResponse<unknown>(res);
        },
    });
}
