import { bffAuthFetch } from '@/shared/api/bffAuthFetch'
import { parseResponse } from '@/shared/api/parseResponse'
import type { AttemptResultDto, TraitDto, ProfessionDto, Page } from '@/shared/api/generated/model'
import type { AttemptViewDto, AttemptViewTrait, AttemptViewProfession } from '@/entities/attempt/model/types'
import { bffFetch } from '@/shared/api/bff/proxy'

function parseAttemptIdFromPath(pathname: string) {
    const m = pathname.match(/^\/api\/attempts\/(\d+)\/view\/?$/)
    if (!m) return null
    const n = Number(m[1])
    return Number.isFinite(n) && n > 0 ? n : null
}

function toScore01(v: unknown): number {
    return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function toId(v: unknown): number {
    return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

export async function GET(req: Request) {
    const url = new URL(req.url)
    const attemptId = parseAttemptIdFromPath(url.pathname)

    if (!attemptId) {
        return new Response(JSON.stringify({ message: 'Invalid attempt id' }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
        })
    }

    const locale = req.headers.get('accept-language') ?? 'en'

    const [resultRes, traitsRes, professionsRes] = await Promise.all([
        bffAuthFetch(`/attempts/${attemptId}/result`, {
            method: 'GET',
            headers: { 'accept-language': locale },
        }),
        bffFetch('/traits', {
            method: 'GET',
            headers: { 'accept-language': locale },
        }),
        bffFetch('/professions?page=1&size=200', {
            method: 'GET',
            headers: { 'accept-language': locale },
        }),
    ])

    if (!resultRes.ok) {
        return new Response(await resultRes.text(), { status: resultRes.status, headers: resultRes.headers })
    }
    if (!traitsRes.ok) {
        return new Response(await traitsRes.text(), { status: traitsRes.status, headers: traitsRes.headers })
    }
    if (!professionsRes.ok) {
        return new Response(await professionsRes.text(), { status: professionsRes.status, headers: professionsRes.headers })
    }

    const result = await parseResponse<AttemptResultDto>(resultRes)
    const traits = await parseResponse<TraitDto[]>(traitsRes)
    const professionsPage = await parseResponse<Page>(professionsRes)

    const professions = Array.isArray(professionsPage.content) ? (professionsPage.content as ProfessionDto[]) : []

    const traitMap = new Map<string, TraitDto>()
    for (const t of traits) {
        if (t.code) traitMap.set(t.code, t)
    }

    const professionMap = new Map<number, ProfessionDto>()
    for (const p of professions) {
        if (typeof p.id === 'number') professionMap.set(p.id, p)
    }

    const traitScores = Array.isArray(result.traitScores) ? result.traitScores : []
    const recs = Array.isArray(result.recommendations) ? result.recommendations : []

    const mergedTraits: AttemptViewTrait[] = traitScores.map((s) => {
        const code = typeof s.traitCode === 'string' ? s.traitCode : ''
        const meta = code ? traitMap.get(code) : undefined

        return {
            code,
            name: meta?.name ?? code,
            description: meta?.description ?? undefined,
            score01: toScore01(s.score),
        }
    })

    const mergedProfessions: AttemptViewProfession[] = recs.map((r) => {
        const id = toId(r.professionId)
        const meta = professionMap.get(id)

        return {
            id,
            title: meta?.title ?? String(id),
            description: meta?.description ?? undefined,
            score01: toScore01(r.score),
        }
    })

    const dto: AttemptViewDto = {
        attemptId,
        traits: mergedTraits,
        professions: mergedProfessions,
    }

    return new Response(JSON.stringify(dto), {
        status: 200,
        headers: { 'content-type': 'application/json' },
    })
}
