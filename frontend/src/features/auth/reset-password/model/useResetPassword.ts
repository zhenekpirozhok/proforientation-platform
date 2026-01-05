'use client';

import { z } from 'zod';
import { useResetPassword as useResetPasswordGenerated } from '@/shared/api/generated/api';
import type { ResetPasswordDto } from '@/shared/api/generated/model';
import { resetPasswordSchema, type ResetPasswordSchemaValues } from '@/shared/validation/resetPasswordSchema';
import { readErrorMessage } from '@/shared/api/readErrorMessage';

export type ResetPasswordResult =
    | { ok: true }
    | { ok: false; zodError?: z.ZodError; message?: string };

export function useResetPassword() {
    const m = useResetPasswordGenerated({
        mutation: { retry: false },
    });

    async function submit(values: ResetPasswordSchemaValues): Promise<ResetPasswordResult> {
        const parsed = resetPasswordSchema.safeParse(values);
        if (!parsed.success) return { ok: false, zodError: parsed.error };

        const payload: ResetPasswordDto = {
            token: parsed.data.token.trim(),
            newPassword: parsed.data.password,
        } as ResetPasswordDto;

        try {
            await m.mutateAsync({ data: payload });
            return { ok: true };
        } catch (e: any) {
            const res: Response | undefined = e?.response;
            if (res instanceof Response) {
                const msg = await readErrorMessage(res);
                return { ok: false, message: msg };
            }
            return { ok: false, message: e instanceof Error ? e.message : 'Reset failed' };
        }
    }

    return { submit, isPending: m.isPending };
}
