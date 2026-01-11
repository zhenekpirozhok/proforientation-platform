'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getGetAll3QueryKey, useCreate6 } from '@/shared/api/generated/api';

export function useAdminCreateCategory() {
    const qc = useQueryClient();

    return useCreate6({
        mutation: {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: getGetAll3QueryKey() });
            },
        },
    });
}
