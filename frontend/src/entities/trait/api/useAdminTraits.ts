'use client';

import { useGetAll } from '@/shared/api/generated/api';

export function useAdminTraits() {
    return useGetAll();
}
