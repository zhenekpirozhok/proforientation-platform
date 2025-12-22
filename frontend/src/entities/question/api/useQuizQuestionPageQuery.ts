import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { parseResponse } from "@/shared/api/parseResponse";
import type { PageLike, Question } from "../model/types";
import { quizQuestionPageKey } from "./queryKeys";

type Params = {
    quizId: number;
    page: number;
    locale: string;
};

export function useQuizQuestionPageQuery({ quizId, page, locale }: Params) {
    return useQuery({
        queryKey: quizQuestionPageKey(quizId, page, locale),
        enabled: Number.isFinite(quizId) && quizId > 0 && page >= 0 && Boolean(locale),
        queryFn: async () => {
            const sp = new URLSearchParams({ page: String(page), size: "1" });

            const res = await fetch(`/api/questions/quiz/${quizId}?${sp.toString()}`, {
                method: "GET",
                headers: { "x-locale": locale },
            });

            const data = await parseResponse<PageLike<Question> | Question[]>(res);

            if (Array.isArray(data)) {
                return { question: data[0] ?? null, total: data.length };
            }

            const question = Array.isArray(data.content) ? data.content[0] ?? null : null;
            const total = typeof data.totalElements === "number" ? data.totalElements : undefined;

            return { question, total };
        },
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
}
