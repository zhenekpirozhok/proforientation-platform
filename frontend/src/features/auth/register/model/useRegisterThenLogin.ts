'use client';

import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRegister } from '@/shared/api/generated/api';
import { registerSchema, type RegisterSchemaValues } from '@/shared/validation/registerSchema';
import { useGuestStore } from '@/entities/guest/model/store';

export type RegisterThenLoginResult =
    | { ok: true }
    | { ok: false; phase: 'register' | 'login'; zodError?: z.ZodError; message?: string };

async function loginViaBff(params: {
    email: string;
    password: string;
    guestToken: string | null;
}) {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            ...(params.guestToken ? { 'x-guest-token': params.guestToken } : {}),
        },
        body: JSON.stringify({ email: params.email, password: params.password }),
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
}

export function useRegisterThenLogin() {
    const qc = useQueryClient();
    const guestToken = useGuestStore((s) => s.guestToken);
    const clearGuest = useGuestStore((s) => s.clearGuestToken);

    const register = useRegister({
        mutation: { retry: false },
        request: { headers: guestToken ? { 'x-guest-token': guestToken } : {} },
    });

    async function submit(values: RegisterSchemaValues): Promise<RegisterThenLoginResult> {
        const parsed = registerSchema.safeParse(values);
        if (!parsed.success) return { ok: false, phase: 'register', zodError: parsed.error };

        const email = parsed.data.email.trim().toLowerCase();
        const displayName = parsed.data.displayName?.trim();
        const password = parsed.data.password;

        try {
            await register.mutateAsync({
                data: {
                    email,
                    password,
                    ...(displayName ? { displayName } : {}),
                },
            });
        } catch (e) {
            return { ok: false, phase: 'register', message: e instanceof Error ? e.message : 'Registration failed' };
        }

        try {
            await loginViaBff({ email, password, guestToken });
        } catch (e) {
            return { ok: false, phase: 'login', message: e instanceof Error ? e.message : 'Login failed' };
        }

        await qc.invalidateQueries({ queryKey: ['/users/me'] });
        clearGuest();

        return { ok: true };
    }

    return { submit, isPending: register.isPending };
}
