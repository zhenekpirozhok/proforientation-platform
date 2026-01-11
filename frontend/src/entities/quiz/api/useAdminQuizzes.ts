'use client';

import { useGetAll1 } from '@/shared/api/generated/api';
import type { GetAll1Params } from '@/shared/api/generated/model';

export function useAdminQuizzes(params?: GetAll1Params) {
    return useGetAll1(params);
}
