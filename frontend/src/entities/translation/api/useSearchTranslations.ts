import { useSearch as useSearchGenerated } from '@/shared/api/generated/api';
import type { SearchParams } from '@/shared/api/generated/model/searchParams';

export const useSearchTranslations = (params?: SearchParams) => {
  // generated hook requires a SearchParams object; when params is undefined, pass an empty object
  return useSearchGenerated((params ?? ({} as SearchParams)) as SearchParams);
};
