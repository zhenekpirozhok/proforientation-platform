import { useUpdate as useUpdateGenerated, getSearchQueryKey } from '@/shared/api/generated/api';
import { useQueryClient } from '@tanstack/react-query';

export const useUpdateTranslation = () => {
    const qc = useQueryClient();

    return useUpdateGenerated({
        mutation: {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: getSearchQueryKey() });
            },
        },
    });
};
