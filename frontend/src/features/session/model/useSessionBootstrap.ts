'use client'

import { useEffect } from 'react'
import { useAuthenticatedUser } from '@/shared/api/generated/api'
import { useSessionStore } from '@/entities/session/model/store'

export function useSessionBootstrap() {
    const setUser = useSessionStore((s) => s.setUser)

    const q = useAuthenticatedUser({
        query: {
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
        },
    })

    useEffect(() => {
        if (q.isLoading) return
        if (q.isSuccess) {
            setUser(q.data as any)
            return
        }
        setUser(null)
    }, [q.isLoading, q.isSuccess, q.data, setUser])

    return q
}
