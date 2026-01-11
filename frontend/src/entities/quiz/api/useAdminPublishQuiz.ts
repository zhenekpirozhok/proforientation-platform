'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
    getGetAll1QueryKey,
    getGetById1QueryKey,
    usePublish,
} from '@/shared/api/generated/api';

export function useAdminPublishQuiz() {
    const qc = useQueryClient();

    return usePublish({
        mutation: {
            onSuccess: (_data, vars) => {
                qc.invalidateQueries({ queryKey: getGetAll1QueryKey() });
                qc.invalidateQueries({ queryKey: getGetById1QueryKey(vars.id) });
            },
        },
    });
}
