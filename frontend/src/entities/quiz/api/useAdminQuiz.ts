'use client';

import { useGetById1 } from '@/shared/api/generated/api';

export function useAdminQuiz(id: number) {
    return useGetById1(id);
}
