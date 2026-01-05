import { NextRequest } from 'next/server'
import { bffFetch } from '@/shared/api/bff/proxy'

export async function GET(req: NextRequest) {
    const search = req.nextUrl.search
    const upstreamPath = `/quizzes/search${search}`
    const xLocale = req.headers.get('x-locale') ?? ''

    const upstreamRes = await bffFetch(upstreamPath, {
        method: 'GET',
        headers: {
            ...(xLocale ? { 'x-locale': xLocale } : {}),
        },
    })

    const body = await upstreamRes.text()

    return new Response(body, {
        status: upstreamRes.status,
        headers: {
            'content-type': upstreamRes.headers.get('content-type') ?? 'application/json',
        },
    })
}
