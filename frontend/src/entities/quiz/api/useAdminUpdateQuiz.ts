'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
    getGetAll1QueryKey,
    getGetById1QueryKey,
    useUpdate2,
} from '@/shared/api/generated/api';

export function useAdminUpdateQuiz() {
    const qc = useQueryClient();

    return useUpdate2({
        mutation: {
            onSuccess: (_data, vars) => {
                qc.invalidateQueries({ queryKey: getGetAll1QueryKey() });
                qc.invalidateQueries({ queryKey: getGetById1QueryKey(vars.id) });
            },
        },
    });
}
