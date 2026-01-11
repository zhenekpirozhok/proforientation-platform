'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getGetAll2QueryKey, useCreate4 } from '@/shared/api/generated/api';

export function useAdminCreateProfession() {
    const qc = useQueryClient();

    return useCreate4({
        mutation: {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: getGetAll2QueryKey() });
            },
        },
    });
}
