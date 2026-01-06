'use client'

import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useGuestStore } from '@/entities/guest/model/store'

const googleOneTapSchema = z.object({
    token: z.string().min(10),
})

export type GoogleOneTapLoginValues = z.infer<typeof googleOneTapSchema>

export type GoogleOneTapLoginResult =
    | { ok: true }
    | { ok: false; zodError?: z.ZodError; message?: string }

export function useGoogleOneTapLogin() {
    const qc = useQueryClient()
    const guestToken = useGuestStore((s) => s.guestToken)

    const m = useMutation({
        mutationKey: ['google-onetap-login'],
        mutationFn: async (values: GoogleOneTapLoginValues) => {
            const res = await fetch('/api/auth/google-onetap', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ token: values.token, ...(guestToken ? { guestToken } : {}) }),
                credentials: 'include',
            })

            const text = await res.text().catch(() => '')
            const data = text
                ? (() => {
                    try {
                        return JSON.parse(text)
                    } catch {
                        return text
                    }
                })()
                : null

            if (!res.ok) {
                const msg =
                    typeof data === 'object' && data && 'message' in data && typeof (data as any).message === 'string'
                        ? (data as any).message
                        : typeof data === 'string'
                            ? data
                            : `Login failed (${res.status})`
                throw new Error(msg)
            }

            return data
        },
        retry: false,
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ['/users/me'] })
        },
    })

    async function submit(values: GoogleOneTapLoginValues): Promise<GoogleOneTapLoginResult> {
        const parsed = googleOneTapSchema.safeParse(values)
        if (!parsed.success) return { ok: false, zodError: parsed.error }

        try {
            await m.mutateAsync(parsed.data)
            return { ok: true }
        } catch (e) {
            return { ok: false, message: e instanceof Error ? e.message : 'Login failed' }
        }
    }

    return { submit, isPending: m.isPending }
}
