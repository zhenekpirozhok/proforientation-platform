import { orvalFetch } from '@/shared/api/orvalFetch';
import { HttpError } from '@/shared/api/httpError';
import type {
  AttemptResultDto,
  AttemptSummaryDto,
} from '@/shared/api/generated/model';
import type { AttemptViewDto } from '@/entities/attempt/model/types';

export async function getMyAttemptsBff(params?: { locale?: string }) {
  try {
    return await orvalFetch<AttemptSummaryDto>('/attempts', {
      headers: params?.locale ? { 'x-locale': params.locale } : undefined,
    });
  } catch (err) {
    throw new HttpError(500, err instanceof Error ? err.message : 'Failed to load attempts');
  }
}

export async function getAttemptResultBff(
  id: number,
  params?: { locale?: string },
) {
  try {
    return await orvalFetch<AttemptResultDto>(`/attempts/${id}/result`, {
      headers: params?.locale ? { 'x-locale': params.locale } : undefined,
    });
  } catch (err) {
    throw new HttpError(500, err instanceof Error ? err.message : 'Failed to load result');
  }
}

export async function getAttemptViewBff(
  id: number,
  params?: { locale?: string },
) {
  try {
    return await orvalFetch<AttemptViewDto>(`/attempts/${id}/view`, {
      headers: params?.locale ? { 'x-locale': params.locale } : undefined,
    });
  } catch (err) {
    throw new HttpError(500, err instanceof Error ? err.message : 'Failed to load view');
  }
}
