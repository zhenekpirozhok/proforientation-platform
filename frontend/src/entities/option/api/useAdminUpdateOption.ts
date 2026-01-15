'use client';

import { useUpdate5 } from '@/shared/api/generated/api';

export function useAdminUpdateOption() {
    return useUpdate5();
}
