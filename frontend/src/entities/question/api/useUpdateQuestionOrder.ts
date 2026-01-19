'use client';

import { useUpdateOrder } from '@/shared/api/generated/api';

export function useUpdateQuestionOrder() {
    return useUpdateOrder();
}
