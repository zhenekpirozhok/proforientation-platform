'use client';

import { useEffect } from 'react';
import { useAuthenticatedUser } from '@/shared/api/generated/api';
import { useSessionStore } from '@/entities/session/model/store';

export function useSessionBootstrap(enabled: boolean) {
    const setUser = useSessionStore((s) => s.setUser);
    const setStatus = useSessionStore((s) => s.setStatus);

    const q = useAuthenticatedUser({
        query: {
            enabled,
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
        },
    });

    useEffect(() => {
        if (!enabled) {
            setUser(null);
            return;
        }

        if (q.isFetching) {
            setStatus('unknown');
            return;
        }

        if (q.isSuccess) {
            setUser(q.data as any);
            return;
        }

        if (q.isError) {
            setUser(null);
            return;
        }
    }, [enabled, q.isFetching, q.isSuccess, q.isError, q.data, setUser, setStatus]);

    return q;
}
