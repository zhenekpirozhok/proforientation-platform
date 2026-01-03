'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SessionStatus = 'unknown' | 'guest' | 'auth';

export type SessionUser = {
    id: number;
    email: string;
    displayName?: string;
    role?: string;
    authorities?: Array<{ authority: string }>;
};

type State = {
    status: SessionStatus;
    user: SessionUser | null;
    setUser: (u: SessionUser | null) => void;
    setStatus: (s: SessionStatus) => void;
    reset: () => void;
};

export const useSessionStore = create<State>()(
    persist(
        (set) => ({
            status: 'unknown',
            user: null,
            setUser: (u) => set({ user: u, status: u ? 'auth' : 'guest' }),
            setStatus: (s) => set({ status: s }),
            reset: () => set({ status: 'guest', user: null }),
        }),
        { name: 'session-store', partialize: (s) => ({ status: s.status, user: s.user }) },
    ),
);
