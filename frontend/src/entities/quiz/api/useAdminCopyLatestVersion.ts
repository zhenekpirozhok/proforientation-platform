'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
    getGetById1QueryKey,
    getGetQuestionsForQuizQueryKey,
    useCopyLatest,
} from '@/shared/api/generated/api';

export function useAdminCopyLatestVersion() {
    const qc = useQueryClient();

    return useCopyLatest({
        mutation: {
            onSuccess: (_data, vars) => {
                qc.invalidateQueries({ queryKey: getGetById1QueryKey(vars.id) });
                qc.invalidateQueries({ queryKey: getGetQuestionsForQuizQueryKey(vars.id) });
            },
        },
    });
}
