import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { QuizDto } from "@/shared/api/generated/model";
import { orvalFetch } from "@/shared/api/orvalFetch";

type QuizzesParams = {
    page?: number;
    size?: number;
    sort?: string | string[];
};

function buildQuizzesUrl(params?: QuizzesParams) {
    const sp = new URLSearchParams();
    sp.set("page", String(params?.page ?? 0));
    sp.set("size", String(params?.size ?? 20));

    const sort = params?.sort;
    if (sort) {
        const arr = Array.isArray(sort) ? sort : [sort];
        for (const s of arr) sp.append("sort", s);
    }

    const qs = sp.toString();
    return qs ? `/quizzes?${qs}` : "/quizzes";
}

export function useQuizzes(params?: QuizzesParams) {
    const url = buildQuizzesUrl(params);
    const stableParams = params ?? {};

    return useQuery({
        queryKey: ["/quizzes", stableParams],
        queryFn: ({ signal }) => orvalFetch<QuizDto>(url, { method: "GET", signal }),
        placeholderData: keepPreviousData,
    });
}
