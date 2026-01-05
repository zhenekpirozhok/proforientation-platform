'use client';

import { z } from 'zod';
import { useRequestReset as useRequestResetGenerated } from '@/shared/api/generated/api';
import type { RequestResetPasswordDto } from '@/shared/api/generated/model';
import { forgotPasswordSchema, type ForgotPasswordSchemaValues } from '@/shared/validation/forgotPasswordSchema';
import { readErrorMessage } from '@/shared/api/readErrorMessage';

export type RequestPasswordResetResult =
    | { ok: true }
    | { ok: false; zodError?: z.ZodError; message?: string };

export function useRequestPasswordReset() {
    const m = useRequestResetGenerated({
        mutation: { retry: false },
    });

    async function submit(values: ForgotPasswordSchemaValues): Promise<RequestPasswordResetResult> {
        const parsed = forgotPasswordSchema.safeParse(values);
        if (!parsed.success) return { ok: false, zodError: parsed.error };

        const payload: RequestResetPasswordDto = {
            email: parsed.data.email.trim().toLowerCase(),
        } as RequestResetPasswordDto;

        try {
            await m.mutateAsync({ data: payload });
            return { ok: true };
        } catch (e: any) {
            const res: Response | undefined = e?.response;
            if (res instanceof Response) {
                const msg = await readErrorMessage(res);
                return { ok: false, message: msg };
            }
            return { ok: false, message: e instanceof Error ? e.message : 'Request failed' };
        }
    }

    return { submit, isPending: m.isPending };
}
