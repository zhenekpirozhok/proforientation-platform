'use client';

import { useCreate5 } from '@/shared/api/generated/api';

export function useAdminCreateOption() {
    return useCreate5();
}
