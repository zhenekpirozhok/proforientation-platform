'use client';

import { useGetAll3 } from '@/shared/api/generated/api';

export function useAdminCategories() {
  return useGetAll3();
}
