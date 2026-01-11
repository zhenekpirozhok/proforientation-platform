'use client';

import { useGetAll2 } from '@/shared/api/generated/api';
import type { GetAll2Params } from '@/shared/api/generated/model';

export function useAdminProfessions(params?: GetAll2Params) {
    return useGetAll2(params);
}
