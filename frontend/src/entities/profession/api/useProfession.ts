import { useGetById2 as useGetProfessionByIdGenerated } from '@/shared/api/generated/api';

export function useProfession(id?: number) {
  const enabled = typeof id === 'number' && id > 0;

  return useGetProfessionByIdGenerated(enabled ? id : 0, {
    query: { enabled },
  });
}
