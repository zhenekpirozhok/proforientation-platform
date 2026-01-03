'use client';

import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGuestStore } from '@/entities/guest/model/store';
import { loginSchema, type LoginSchemaValues } from '@/shared/validation/loginSchema';

export type LoginUserResult =
    | { ok: true }
    | { ok: false; zodError?: z.ZodError; message?: string };

export function useLoginUser() {
    const qc = useQueryClient();
    const guestToken = useGuestStore((s) => s.guestToken);

    const m = useMutation({
        mutationKey: ['login'],
        mutationFn: async (values: LoginSchemaValues) => {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    ...(guestToken ? { 'x-guest-token': guestToken } : {}),
                },
                body: JSON.stringify({
                    email: values.email.trim().toLowerCase(),
                    password: values.password,
                }),
                credentials: 'include',
            });

            const text = await res.text().catch(() => '');
            const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

            if (!res.ok) {
                const msg =
                    typeof data === 'object' && data && 'message' in data && typeof (data as any).message === 'string'
                        ? (data as any).message
                        : typeof data === 'string'
                            ? data
                            : `Login failed (${res.status})`;
                throw new Error(msg);
            }

            return data;
        },
        retry: false,
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ['/users/me'] });
        },
    });

    async function submit(values: LoginSchemaValues): Promise<LoginUserResult> {
        const parsed = loginSchema.safeParse(values);
        if (!parsed.success) return { ok: false, zodError: parsed.error };

        try {
            await m.mutateAsync(parsed.data);
            return { ok: true };
        } catch (e) {
            return { ok: false, message: e instanceof Error ? e.message : 'Login failed' };
        }
    }

    return { submit, isPending: m.isPending };
}
