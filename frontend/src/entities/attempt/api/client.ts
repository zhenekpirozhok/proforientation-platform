import { authFetch } from '@/shared/api/authFetch';
import { HttpError } from '@/shared/api/httpError';
import { readErrorMessage } from '@/shared/api/readErrorMessage';
import type { AttemptResultDto, AttemptSummaryDto } from '@/shared/api/generated/model';
import type { AttemptViewDto } from '@/entities/attempt/model/types';

export async function getMyAttemptsBff(params?: { locale?: string }) {
    const res = await authFetch('/api/attempts', {
        method: 'GET',
        headers: params?.locale ? { 'x-locale': params.locale } : undefined,
    });

    if (!res.ok) throw new HttpError(res.status, await readErrorMessage(res));
    return (await res.json()) as AttemptSummaryDto;
}

export async function getAttemptResultBff(id: number, params?: { locale?: string }) {
    const res = await authFetch(`/api/attempts/${id}/result`, {
        method: 'GET',
        headers: params?.locale ? { 'x-locale': params.locale } : undefined,
    });

    if (!res.ok) throw new HttpError(res.status, await readErrorMessage(res));
    return (await res.json()) as AttemptResultDto;
}

export async function getAttemptViewBff(id: number, params?: { locale?: string }) {
    const res = await authFetch(`/api/attempts/${id}/view`, {
        method: 'GET',
        headers: params?.locale ? { 'x-locale': params.locale } : undefined,
    });

    if (!res.ok) throw new HttpError(res.status, await readErrorMessage(res));
    return (await res.json()) as AttemptViewDto;
}
