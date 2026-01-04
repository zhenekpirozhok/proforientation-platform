import { authFetch } from '@/shared/api/authFetch';
import { HttpError } from '@/shared/api/httpError';
import { readErrorMessage } from '@/shared/api/readErrorMessage';
import type { AttemptResultDto, AttemptSummaryDto } from '@/shared/api/generated/model';

export async function getMyAttemptsBff() {
    const res = await authFetch('/api/attempts', { method: 'GET' });
    if (!res.ok) throw new HttpError(res.status, await readErrorMessage(res));
    return (await res.json()) as AttemptSummaryDto;
}

export async function getAttemptResultBff(id: number) {
    const res = await authFetch(`/api/attempts/${id}/result`, { method: 'GET' });
    if (!res.ok) throw new HttpError(res.status, await readErrorMessage(res));
    return (await res.json()) as AttemptResultDto;
}
