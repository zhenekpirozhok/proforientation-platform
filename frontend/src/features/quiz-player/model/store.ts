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
        const s = get();
        const already =
          s.quizId === quizId &&
          s.quizVersionId === quizVersionId &&
          s.attemptId == null &&
          s.guestToken == null &&
          s.status === 'starting' &&
          s.error == null &&
          s.currentIndex === 0 &&
          s.totalQuestions == null &&
          Object.keys(s.answersByQuestionId).length === 0 &&
          s.result == null &&
          s.bulkSentAttemptId == null;

        if (already) return;

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

          const already =
            s.status === 'in-progress' &&
            s.error == null &&
            s.currentIndex === nextIndex &&
            s.quizId === quizId &&
            s.quizVersionId === quizVersionId;

          if (already) return;

          set({
            quizId,
            quizVersionId,
            status: 'in-progress',
            error: null,
            currentIndex: nextIndex,
          });
          return;
        }

        const alreadyReset =
          s.quizId === quizId &&
          s.quizVersionId === quizVersionId &&
          s.attemptId == null &&
          s.guestToken == null &&
          s.status === 'starting' &&
          s.error == null &&
          s.currentIndex === 0 &&
          s.totalQuestions == null &&
          Object.keys(s.answersByQuestionId).length === 0 &&
          s.result == null &&
          s.bulkSentAttemptId == null;

        if (alreadyReset) return;

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
        const already =
          s.attemptId === attemptId &&
          s.guestToken === guestToken &&
          s.status === 'in-progress' &&
          s.error == null;

        if (already) return;

        useGuestStore.getState().setGuestToken(guestToken);

        set({
          attemptId,
          guestToken,
          status: 'in-progress',
          error: null,
          bulkSentAttemptId: null,
        });
      },

      setStatus: (status) => {
        const s = get();
        if (s.status === status) return;
        set({ status });
      },

      setError: (error) => {
        const s = get();
        if (s.error === error && (error == null || s.status === 'error'))
          return;

        if (error == null) {
          set({ error: null });
          return;
        }

        set({ error, status: 'error' });
      },

      setIndex: (index) =>
        set((s) => {
          const next = clampIndex(index, s.totalQuestions);
          if (s.currentIndex === next) return {};
          return { currentIndex: next };
        }),

      goNext: () =>
        set((s) => {
          const next = clampIndex(s.currentIndex + 1, s.totalQuestions);
          if (s.currentIndex === next) return {};
          return { currentIndex: next };
        }),

      goPrev: () =>
        set((s) => {
          const next = clampIndex(s.currentIndex - 1, s.totalQuestions);
          if (s.currentIndex === next) return {};
          return { currentIndex: next };
        }),

      setTotalQuestions: (total) =>
        set((s) => {
          const nextIndex = clampIndex(s.currentIndex, total);
          const sameTotal = s.totalQuestions === total;
          const sameIndex = s.currentIndex === nextIndex;
          if (sameTotal && sameIndex) return {};
          return { totalQuestions: total, currentIndex: nextIndex };
        }),

      selectOption: (questionId, optionId) =>
        set((s) => {
          if (s.answersByQuestionId[questionId] === optionId) return {};
          return {
            answersByQuestionId: {
              ...s.answersByQuestionId,
              [questionId]: optionId,
            },
          };
        }),

      setResult: (result) => {
        const s = get();
        if (s.result === result) return;
        set({ result });
      },

      setBulkSent: (attemptId) => {
        const s = get();
        if (s.bulkSentAttemptId === attemptId) return;
        set({ bulkSentAttemptId: attemptId });
      },

      resetAll: () => {
        useGuestStore.getState().clearGuestToken();
        set(initialState);
      },
    }),
    {
      name: 'quiz-player:v5',
      version: 5,
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
        if (state.status !== 'idle') state.setStatus('idle');
        if (state.error != null) state.setError(null);
      },
    },
  ),
);
