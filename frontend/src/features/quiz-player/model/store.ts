import { create } from "zustand";
import type { QuizPlayerState, QuizPlayerStatus } from "./types";

type QuizPlayerActions = {
    start(quizId: number): void;
    setAttempt(attemptId: number, guestToken: string): void;
    setStatus(status: QuizPlayerStatus): void;
    setError(error: string | null): void;
    reset(): void;
};

const initialState: QuizPlayerState = {
    quizId: 0,
    attemptId: null,
    guestToken: null,
    status: "idle",
    error: null,
};

export const useQuizPlayerStore = create<QuizPlayerState & QuizPlayerActions>((set) => ({
    ...initialState,

    start: (quizId) =>
        set({
            quizId,
            attemptId: null,
            guestToken: null,
            status: "starting",
            error: null,
        }),

    setAttempt: (attemptId, guestToken) =>
        set({
            attemptId,
            guestToken,
            status: "in-progress",
        }),

    setStatus: (status) => set({ status }),

    setError: (error) =>
        set({
            error,
            status: "error",
        }),

    reset: () => set(initialState),
}));
