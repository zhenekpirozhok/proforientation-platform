import { useMemo } from 'react';
import { useSearch2 } from '@/shared/api/generated/api';

export function useSearchProfessions(params?: { q?: string; categoryId?: number; page?: number; size?: number; sort?: string }) {
    const normalized = useMemo(() => ({
        q: params?.q ?? undefined,
        categoryId: params?.categoryId ?? undefined,
        page: params?.page ?? 1,
        size: params?.size ?? 20,
        sort: params?.sort ?? 'id',
    }), [params?.q, params?.categoryId, params?.page, params?.size, params?.sort]);

    return useSearch2(normalized as any);
}
