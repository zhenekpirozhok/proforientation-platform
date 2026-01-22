import { useSearch as useSearchGenerated } from '@/shared/api/generated/api';
import type { SearchParams } from '@/shared/api/generated/model/searchParams';

export const useSearchTranslations = (params?: SearchParams) => {
  return useSearchGenerated((params ?? ({} as SearchParams)) as SearchParams);
};
