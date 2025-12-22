import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { QuizPlayerState, QuizPlayerStatus } from "./types";

type QuizPlayerActions = {
    startFresh(quizId: number, quizVersionId: number): void;

    resumeOrStart(quizId: number, quizVersionId: number): void;

    setAttempt(attemptId: number, guestToken: string): void;

    setStatus(status: QuizPlayerStatus): void;
    setError(error: string | null): void;

    setIndex(index: number): void;
    goNext(): void;
    goPrev(): void;

    setTotalQuestions(total: number | null): void;

    selectOption(questionId: number, optionId: number): void;

    resetAll(): void;
};

export type QuizPlayerStore = QuizPlayerState & QuizPlayerActions;

const initialState: QuizPlayerState = {
    quizId: 0,
    quizVersionId: null,

    attemptId: null,
    guestToken: null,

    status: "idle",
    error: null,

    currentIndex: 0,
    totalQuestions: null,
    answersByQuestionId: {},
};

function clampIndex(index: number, total: number | null) {
    const safe = Math.max(0, index);
    if (total == null) return safe;
    return Math.min(safe, Math.max(0, total - 1));
}

export const useQuizPlayerStore = create<QuizPlayerStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            startFresh: (quizId, quizVersionId) =>
                set({
                    quizId,
                    quizVersionId,
                    attemptId: null,
                    guestToken: null,
                    status: "starting",
                    error: null,
                    currentIndex: 0,
                    totalQuestions: null,
                    answersByQuestionId: {},
                }),

            resumeOrStart: (quizId, quizVersionId) => {
                const s = get();

                const canResume =
                    s.quizId === quizId &&
                    s.quizVersionId === quizVersionId &&
                    Boolean(s.attemptId) &&
                    Boolean(s.guestToken);

                if (canResume) {
                    set({
                        quizId,
                        quizVersionId,
                        status: "in-progress",
                        error: null,
                        currentIndex: clampIndex(s.currentIndex, s.totalQuestions),
                    });
                    return;
                }

                set({
                    quizId,
                    quizVersionId,
                    attemptId: null,
                    guestToken: null,
                    status: "starting",
                    error: null,
                    currentIndex: 0,
                    totalQuestions: null,
                    answersByQuestionId: {},
                });
            },

            setAttempt: (attemptId, guestToken) =>
                set({
                    attemptId,
                    guestToken,
                    status: "in-progress",
                    error: null,
                }),

            setStatus: (status) => set({ status }),

            setError: (error) => set({ error, status: "error" }),

            setIndex: (index) =>
                set((s) => ({ currentIndex: clampIndex(index, s.totalQuestions) })),

            goNext: () =>
                set((s) => ({
                    currentIndex: clampIndex(s.currentIndex + 1, s.totalQuestions),
                })),

            goPrev: () =>
                set((s) => ({
                    currentIndex: clampIndex(s.currentIndex - 1, s.totalQuestions),
                })),

            setTotalQuestions: (total) =>
                set((s) => ({
                    totalQuestions: total,
                    currentIndex: clampIndex(s.currentIndex, total),
                })),

            selectOption: (questionId, optionId) =>
                set((s) => ({
                    answersByQuestionId: { ...s.answersByQuestionId, [questionId]: optionId },
                })),

            resetAll: () => set(initialState),
        }),
        {
            name: "quiz-player:v1",
            storage: createJSONStorage(() => localStorage),
            version: 1,
            partialize: (s) => ({
                quizId: s.quizId,
                quizVersionId: s.quizVersionId,
                attemptId: s.attemptId,
                guestToken: s.guestToken,
                currentIndex: s.currentIndex,
                totalQuestions: s.totalQuestions,
                answersByQuestionId: s.answersByQuestionId,
                status: s.status,
                error: s.error,
            }),
        }
    )
);
