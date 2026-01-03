'use client';

import { useRegister } from '@/shared/api/generated/api';
import type { RegisterUserDto } from '@/shared/api/generated/model';

export type RegisterFormValues = RegisterUserDto & {
    confirmPassword: string;
};

export type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

export type RegisterUserResult =
    | { ok: true }
    | { ok: false; message: string; fieldErrors?: FieldErrors };

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}

function pickMessage(e: unknown): string {
    if (e instanceof Error && e.message) return e.message;
    if (typeof e === 'string') return e;
    return 'Registration failed';
}

function parseExceptionDtoMessage(e: unknown): string | null {
    if (!isRecord(e)) return null;
    const msg = e.message;
    return typeof msg === 'string' && msg.trim() ? msg : null;
}

function mapMessageToFieldErrors(message: string): FieldErrors | undefined {
    const m = message.toLowerCase();

    if (m.includes('email') && (m.includes('exist') || m.includes('already'))) {
        return { email: 'This email is already registered' };
    }

    if (m.includes('password') && (m.includes('weak') || m.includes('invalid'))) {
        return { password: message };
    }

    return undefined;
}

export function useRegisterUser() {
    const m = useRegister({ mutation: { retry: false } });

    async function submit(values: RegisterFormValues): Promise<RegisterUserResult> {
        try {
            const displayName = values.displayName?.trim();
            const payload = {
                email: values.email.trim().toLowerCase(),
                password: values.password,
                ...(displayName ? { displayName } : {}),
            };

            await m.mutateAsync({ data: payload });

            return { ok: true };
        } catch (e) {
            const message = parseExceptionDtoMessage(e) ?? pickMessage(e);
            const fieldErrors = mapMessageToFieldErrors(message);
            return { ok: false, message, fieldErrors };
        }
    }

    return {
        submit,
        isPending: m.isPending,
    };
}
