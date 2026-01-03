'use client';

import { useMemo } from 'react';
import type { ProfessionCategoryDto } from '@/shared/api/generated/model';
import { useGetAll3 } from '@/shared/api/generated/api';

function normalizeArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v == null) return [];
  return [v as T];
}

export function useCategories() {
  const q = useGetAll3({
    query: { staleTime: 10 * 60_000, gcTime: 30 * 60_000 },
  });

  const categories = useMemo(
    () => normalizeArray<ProfessionCategoryDto>(q.data),
    [q.data],
  );

  return {
    ...q,
    data: categories,
  };
}
