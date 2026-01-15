'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';

/**
 * Creates a new draft quiz version via BFF.
 * POST /api/quizzes/{id}/versions proxies to backend POST /quizzes/{id}/versions
 */
async function createQuizVersionApi(id: number) {
    const res = await fetch(`/api/quizzes/${id}/versions`, { method: 'POST' });
    const text = await res.text();
    try {
        const json = JSON.parse(text);
        if (!res.ok) throw json;
        return json;
    } catch (e) {
        if (!res.ok) throw new Error(text || 'Failed to create quiz version');
        return text;
    }
}

/**
 * Hook to create a new draft quiz version.
 * Returns a mutation that accepts { id: number }
 */
export const useCreateQuizVersion = (): UseMutationResult<any, unknown, { id: number }, unknown> => {
    return useMutation({
        mutationFn: (vars: { id: number }) => createQuizVersionApi(vars.id),
    });
};
