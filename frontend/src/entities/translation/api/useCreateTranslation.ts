import {
  useCreate as useCreateGenerated,
  getSearchQueryKey,
} from '@/shared/api/generated/api';
import { useQueryClient } from '@tanstack/react-query';

export const useCreateTranslation = () => {
  const qc = useQueryClient();

  return useCreateGenerated({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getSearchQueryKey() });
      },
    },
  });
};
