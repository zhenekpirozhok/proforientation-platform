'use client'

import { useQuery } from '@tanstack/react-query'
import type { AttemptViewDto } from '@/entities/attempt/model/types'

export function useAttemptViewQuery(attemptId: number | null) {
    return useQuery({
        enabled: typeof attemptId === 'number' && attemptId > 0,
        queryKey: ['attempt-view', attemptId],
        queryFn: async () => {
            const res = await fetch(`/api/attempts/${attemptId}/view`, {
                credentials: 'include',
                cache: 'no-store',
            })
            if (!res.ok) {
                const text = await res.text().catch(() => '')
                throw new Error(text || `Failed to load attempt view (${res.status})`)
            }
            return (await res.json()) as AttemptViewDto
        },
    })
}
