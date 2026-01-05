'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import type { ProfessionDto, TraitDto } from '@/shared/api/generated/model'

type CatalogDto = {
    quizId: number
    categoryId: number
    traits: TraitDto[]
    professions: ProfessionDto[]
}

export function useQuizCatalogForResults(quizId: number) {
    const { locale } = useParams<{ locale: string }>()

    return useQuery({
        queryKey: ['results', 'catalog', quizId, locale],
        enabled: Number.isFinite(quizId) && quizId > 0 && Boolean(locale),
        queryFn: async ({ signal }) => {
            const res = await fetch(`/api/results/catalog?quizId=${encodeURIComponent(String(quizId))}`, {
                method: 'GET',
                headers: { 'x-locale': locale },
                signal,
                cache: 'no-store',
            })

            const text = await res.text().catch(() => '')
            const data = text ? (() => { try { return JSON.parse(text) } catch { return text } })() : null

            if (!res.ok) {
                const msg =
                    typeof data === 'object' && data && 'message' in data && typeof (data as any).message === 'string'
                        ? (data as any).message
                        : typeof data === 'string'
                            ? data
                            : `Request failed (${res.status})`
                throw new Error(msg)
            }

            return data as CatalogDto
        },
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
    })
}
