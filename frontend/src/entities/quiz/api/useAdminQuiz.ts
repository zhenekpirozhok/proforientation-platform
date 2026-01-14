'use client';

import { useGetById1 } from '@/shared/api/generated/api';
import type { QueryClient } from '@tanstack/react-query';

export function useAdminQuiz(id: number, options?: any, queryClient?: QueryClient) {
    return useGetById1(id, options, queryClient);
}
