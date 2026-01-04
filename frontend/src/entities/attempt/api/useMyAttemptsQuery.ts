'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AttemptSummaryDto } from '@/shared/api/generated/model';
import { getMyAttemptsBff } from './client';

function normalizeAttempts(data: unknown): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as any[];
    if (typeof data === 'object' && data && Array.isArray((data as any).content)) return (data as any).content as any[];
    if (typeof data === 'object' && data && Array.isArray((data as any).list)) return (data as any).list as any[];
    return [];
}

export function useMyAttemptsQuery() {
    const key = useMemo(() => ['attempts'] as const, []);

    return useQuery({
        queryKey: key,
        queryFn: async () => {
            const raw = await getMyAttemptsBff();
            const list = normalizeAttempts(raw);
            return { raw: raw as AttemptSummaryDto, list };
        },
        staleTime: 30_000,
        retry: false,
    });
}
