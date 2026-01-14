'use client';

import { useGetAdminQuizzes } from '@/shared/api/generated/api';
import type { GetAdminQuizzesParams } from '@/shared/api/generated/model';

export function useAdminQuizzes(params?: GetAdminQuizzesParams) {
    return useGetAdminQuizzes(params);
}
