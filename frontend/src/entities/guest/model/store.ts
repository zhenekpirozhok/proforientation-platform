'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type GuestState = {
    guestToken: string | null;
    setGuestToken: (t: string | null) => void;
    clearGuestToken: () => void;
};

export const useGuestStore = create<GuestState>()(
    persist(
        (set) => ({
            guestToken: null,
            setGuestToken: (t) => set({ guestToken: t }),
            clearGuestToken: () => set({ guestToken: null }),
        }),
        { name: 'guest-store', partialize: (s) => ({ guestToken: s.guestToken }) },
    ),
);
