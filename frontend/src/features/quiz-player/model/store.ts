'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QuizPlayerState, QuizPlayerStatus, AttemptResult } from './types';
import { useGuestStore } from '@/entities/guest/model/store';

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

  setResult(result: AttemptResult | null): void;

  setBulkSent(attemptId: number | null): void;

  resetAll(): void;
};

export type QuizPlayerStore = QuizPlayerState & QuizPlayerActions;

const initialState: QuizPlayerState = {
  quizId: 0,
  quizVersionId: null,

  attemptId: null,
  guestToken: null,

  status: 'idle',
  error: null,

  currentIndex: 0,
  totalQuestions: null,
  answersByQuestionId: {},

  result: null,

  bulkSentAttemptId: null,
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

      startFresh: (quizId, quizVersionId) => {
        set({
          quizId,
          quizVersionId,
          attemptId: null,
          guestToken: null,
          status: 'starting',
          error: null,
          currentIndex: 0,
          totalQuestions: null,
          answersByQuestionId: {},
          result: null,
          bulkSentAttemptId: null,
        });
      },

      resumeOrStart: (quizId, quizVersionId) => {
        const s = get();
        const isCompleted = s.result != null || s.status === 'finished';

        const canResume =
          !isCompleted &&
          s.quizId === quizId &&
          s.quizVersionId === quizVersionId &&
          s.attemptId != null &&
          s.guestToken != null;

        if (canResume) {
          const nextIndex = clampIndex(s.currentIndex, s.totalQuestions);
          set({
            quizId,
            quizVersionId,
            status: 'in-progress',
            error: null,
            currentIndex: nextIndex,
          });
          return;
        }

        set({
          quizId,
          quizVersionId,
          attemptId: null,
          guestToken: null,
          status: 'starting',
          error: null,
          currentIndex: 0,
          totalQuestions: null,
          answersByQuestionId: {},
          result: null,
          bulkSentAttemptId: null,
        });
      },

      setAttempt: (attemptId, guestToken) => {
        const s = get();
        if (s.attemptId === attemptId && s.guestToken === guestToken && s.status === 'in-progress' && s.error == null) {
          return;
        }

        useGuestStore.getState().setGuestToken(guestToken);

        set({
          attemptId,
          guestToken,
          status: 'in-progress',
          error: null,
          bulkSentAttemptId: null,
        });
      },

      setStatus: (status) => set({ status }),

      setError: (error) => {
        if (error == null) {
          set({ error: null });
          return;
        }
        set({ error, status: 'error' });
      },

      setIndex: (index) => set((s) => ({ currentIndex: clampIndex(index, s.totalQuestions) })),

      goNext: () => set((s) => ({ currentIndex: clampIndex(s.currentIndex + 1, s.totalQuestions) })),

      goPrev: () => set((s) => ({ currentIndex: clampIndex(s.currentIndex - 1, s.totalQuestions) })),

      setTotalQuestions: (total) =>
        set((s) => ({
          totalQuestions: total,
          currentIndex: clampIndex(s.currentIndex, total),
        })),

      selectOption: (questionId, optionId) =>
        set((s) => ({
          answersByQuestionId: {
            ...s.answersByQuestionId,
            [questionId]: optionId,
          },
        })),

      setResult: (result) => set({ result }),

      setBulkSent: (attemptId) => set({ bulkSentAttemptId: attemptId }),

      resetAll: () => {
        useGuestStore.getState().clearGuestToken();
        set(initialState);
      },
    }),
    {
      name: 'quiz-player:v2',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        quizId: s.quizId,
        quizVersionId: s.quizVersionId,
        attemptId: s.attemptId,
        guestToken: s.guestToken,
        currentIndex: s.currentIndex,
        totalQuestions: s.totalQuestions,
        answersByQuestionId: s.answersByQuestionId,
        result: s.result,
        bulkSentAttemptId: s.bulkSentAttemptId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.setStatus('idle');
        state.setError(null);
      },
    },
  ),
);
