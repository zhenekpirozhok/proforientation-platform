'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
    getGetAll1QueryKey,
    getGetById1QueryKey,
    getGetQuestionsForQuizQueryKey,
    useDelete2,
} from '@/shared/api/generated/api';

export function useAdminDeleteQuiz() {
    const qc = useQueryClient();

    return useDelete2({
        mutation: {
            onSuccess: (_data, vars) => {
                qc.invalidateQueries({ queryKey: getGetAll1QueryKey() });
                qc.removeQueries({ queryKey: getGetById1QueryKey(vars.id) });
                qc.removeQueries({ queryKey: getGetQuestionsForQuizQueryKey(vars.id) });
            },
        },
    });
}
