"use client";

import { useMemo } from "react";
import type { ProfessionCategoryDto } from "@/shared/api/generated/model";
import { useGetAll3 } from "@/shared/api/generated/api";

function normalizeArray<T>(v: T | T[] | null | undefined): T[] {
    if (Array.isArray(v)) return v;
    if (v == null) return [];
    return [v];
}

export function useCategories() {
    const q = useGetAll3({
        query: { staleTime: 10 * 60_000, gcTime: 30 * 60_000 },
    });

    const categories = useMemo(
        () => normalizeArray<ProfessionCategoryDto>(q.data as any),
        [q.data]
    );

    return {
        ...q,
        data: categories,
    };
}
