'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import type { ProfessionDto, TraitDto } from '@/shared/api/generated/model';

type CatalogDto = {
  quizId: number;
  categoryId: number;
  traits: TraitDto[];
  professions: ProfessionDto[];
};

type MessageEnvelope = { message?: unknown };

function tryGetMessage(v: unknown): string | null {
  if (typeof v !== 'object' || v === null) return null;
  if (!('message' in v)) return null;

  const msg = (v as MessageEnvelope).message;
  return typeof msg === 'string' ? msg : null;
}

export function useQuizCatalogForResults(quizId: number, locale?: string) {

  return useQuery({
    queryKey: ['results', 'catalog', quizId, locale ?? 'no-locale'],
    enabled: Number.isFinite(quizId) && quizId > 0 && Boolean(locale),
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `/api/results/catalog?quizId=${encodeURIComponent(String(quizId))}`,
        {
          method: 'GET',
          headers: locale ? { 'x-locale': locale } : undefined,
          signal,
          cache: 'no-store',
        },
      );

      const text = await res.text().catch(() => '');
      const data: unknown = text
        ? (() => {
          try {
            return JSON.parse(text) as unknown;
          } catch {
            return text;
          }
        })()
        : null;

      if (!res.ok) {
        const msg = tryGetMessage(data);
        const message =
          msg ??
          (typeof data === 'string' ? data : `Request failed (${res.status})`);
        throw new Error(message);
      }

      return data as CatalogDto;
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}
