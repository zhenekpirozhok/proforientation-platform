'use client';

import { useMemo } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { AttemptSummaryDto } from '@/shared/api/generated/model';
import { getMyAttemptsBff } from './client';

type AttemptsEnvelope =
    | AttemptSummaryDto
    | AttemptSummaryDto[]
    | { content?: AttemptSummaryDto[] }
    | { list?: AttemptSummaryDto[] };

function normalizeAttempts(data: AttemptsEnvelope | unknown): AttemptSummaryDto[] {
    if (!data) return [];

    if (Array.isArray(data)) return data as AttemptSummaryDto[];

    if (typeof data === 'object' && data) {
        const o = data as any;
        if (Array.isArray(o.content)) return o.content as AttemptSummaryDto[];
        if (Array.isArray(o.list)) return o.list as AttemptSummaryDto[];
    }

    return [];
}

export function useMyAttemptsQuery() {
    const locale = useLocale();
    const key = useMemo(() => ['attempts', locale] as const, [locale]);

    return useSuspenseQuery({
        queryKey: key,
        queryFn: async () => {
            const raw = await getMyAttemptsBff({ locale });
            const list = normalizeAttempts(raw);
            return { raw: raw as AttemptsEnvelope, list };
        },
        staleTime: 30_000,
        retry: false,
    });
}
