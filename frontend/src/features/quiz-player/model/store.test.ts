// src/features/quiz-player/model/store.test.ts
import { useQuizPlayerStore } from './store';

const STORAGE_KEY = 'quiz-player:v2';

function resetStore() {
    // Clear persisted storage + reset in-memory Zustand state
    localStorage.clear();
    useQuizPlayerStore.getState().resetAll();
}

function getState() {
    return useQuizPlayerStore.getState();
}

describe('quiz-player store', () => {
    beforeEach(() => {
        resetStore();
    });

    describe('startFresh', () => {
        test('sets starting state and clears attempt/answers/result', () => {
            // dirty state first
            useQuizPlayerStore.setState({
                quizId: 123,
                quizVersionId: 999,
                attemptId: 777,
                guestToken: 'token',
                status: 'in-progress',
                error: 'boom',
                currentIndex: 5,
                totalQuestions: 10,
                answersByQuestionId: { 1: 2, 2: 3 },
                result: { attemptId: 777 } as any,
                bulkSentAttemptId: 777,
            });

            getState().startFresh(1, 10);

            const s = getState();
            expect(s.quizId).toBe(1);
            expect(s.quizVersionId).toBe(10);
            expect(s.attemptId).toBeNull();
            expect(s.guestToken).toBeNull();
            expect(s.status).toBe('starting');
            expect(s.error).toBeNull();
            expect(s.currentIndex).toBe(0);
            expect(s.totalQuestions).toBeNull();
            expect(s.answersByQuestionId).toEqual({});
            expect(s.result).toBeNull();
            expect(s.bulkSentAttemptId).toBeNull();
        });

        test('is idempotent when already in the same fresh starting state', () => {
            getState().startFresh(1, 10);
            const before = getState();

            // call again with the same args — should keep the same state (no changes)
            getState().startFresh(1, 10);
            const after = getState();

            expect(after).toEqual(before);
        });
    });

    describe('resumeOrStart', () => {
        test('resumes if attempt+token exist for same quiz/version and not completed', () => {
            useQuizPlayerStore.setState({
                quizId: 1,
                quizVersionId: 10,
                attemptId: 555,
                guestToken: 'guest',
                status: 'starting',
                error: 'some error',
                currentIndex: 999, // will be clamped
                totalQuestions: 3,
                result: null,
            });

            getState().resumeOrStart(1, 10);

            const s = getState();
            expect(s.status).toBe('in-progress');
            expect(s.error).toBeNull();
            // totalQuestions=3 => max index = 2
            expect(s.currentIndex).toBe(2);
            // attempt data stays
            expect(s.attemptId).toBe(555);
            expect(s.guestToken).toBe('guest');
        });

        test('starts fresh if cannot resume (different quiz/version)', () => {
            useQuizPlayerStore.setState({
                quizId: 1,
                quizVersionId: 10,
                attemptId: 555,
                guestToken: 'guest',
                status: 'in-progress',
                currentIndex: 2,
                totalQuestions: 3,
                answersByQuestionId: { 1: 2 },
            });

            getState().resumeOrStart(2, 20);

            const s = getState();
            expect(s.quizId).toBe(2);
            expect(s.quizVersionId).toBe(20);
            expect(s.status).toBe('starting');
            expect(s.attemptId).toBeNull();
            expect(s.guestToken).toBeNull();
            expect(s.currentIndex).toBe(0);
            expect(s.totalQuestions).toBeNull();
            expect(s.answersByQuestionId).toEqual({});
        });

        test('does not resume if completed (result present)', () => {
            useQuizPlayerStore.setState({
                quizId: 1,
                quizVersionId: 10,
                attemptId: 555,
                guestToken: 'guest',
                status: 'in-progress',
                currentIndex: 1,
                totalQuestions: 3,
                result: { attemptId: 555 } as any,
            });

            getState().resumeOrStart(1, 10);

            const s = getState();
            // since completed => should start fresh
            expect(s.status).toBe('starting');
            expect(s.attemptId).toBeNull();
            expect(s.guestToken).toBeNull();
            expect(s.currentIndex).toBe(0);
            expect(s.totalQuestions).toBeNull();
            expect(s.result).toBeNull();
        });

        test('does not resume if completed (status finished)', () => {
            useQuizPlayerStore.setState({
                quizId: 1,
                quizVersionId: 10,
                attemptId: 555,
                guestToken: 'guest',
                status: 'finished',
                currentIndex: 1,
                totalQuestions: 3,
                result: null,
            });

            getState().resumeOrStart(1, 10);

            const s = getState();
            expect(s.status).toBe('starting');
            expect(s.attemptId).toBeNull();
            expect(s.guestToken).toBeNull();
        });
    });

    describe('attempt', () => {
        test('setAttempt sets attemptId/guestToken and switches to in-progress, clears error and bulkSentAttemptId', () => {
            useQuizPlayerStore.setState({
                status: 'starting',
                error: 'oops',
                bulkSentAttemptId: 999,
            });

            getState().setAttempt(100, 't');

            const s = getState();
            expect(s.attemptId).toBe(100);
            expect(s.guestToken).toBe('t');
            expect(s.status).toBe('in-progress');
            expect(s.error).toBeNull();
            expect(s.bulkSentAttemptId).toBeNull();
        });

        test('setAttempt is idempotent for same values when already in-progress without error', () => {
            getState().setAttempt(100, 't');
            const before = getState();

            getState().setAttempt(100, 't');
            const after = getState();

            expect(after).toEqual(before);
        });
    });

    describe('navigation / clamp', () => {
        test('setTotalQuestions clamps currentIndex down to total-1', () => {
            useQuizPlayerStore.setState({ currentIndex: 10, totalQuestions: null });

            getState().setTotalQuestions(3);

            const s = getState();
            expect(s.totalQuestions).toBe(3);
            expect(s.currentIndex).toBe(2);
        });

        test('setIndex clamps negative to 0 and clamps to total-1 when total is set', () => {
            getState().setTotalQuestions(5);

            getState().setIndex(-10);
            expect(getState().currentIndex).toBe(0);

            getState().setIndex(999);
            expect(getState().currentIndex).toBe(4);
        });

        test('goNext/goPrev clamp within bounds when totalQuestions is set', () => {
            getState().setTotalQuestions(2); // indices: 0..1

            getState().setIndex(0);
            getState().goPrev();
            expect(getState().currentIndex).toBe(0);

            getState().goNext();
            expect(getState().currentIndex).toBe(1);

            getState().goNext();
            expect(getState().currentIndex).toBe(1);
        });

        test('when totalQuestions is null, index can increase without upper clamp', () => {
            useQuizPlayerStore.setState({ totalQuestions: null, currentIndex: 0 });

            getState().goNext();
            getState().goNext();
            expect(getState().currentIndex).toBe(2);
        });
    });

    describe('answers', () => {
        test('selectOption sets answer for a questionId and overwrites previous', () => {
            getState().selectOption(10, 100);
            expect(getState().answersByQuestionId[10]).toBe(100);

            getState().selectOption(10, 200);
            expect(getState().answersByQuestionId[10]).toBe(200);
        });
    });

    describe('result / bulk', () => {
        test('setResult and setBulkSent update state', () => {
            getState().setResult({ attemptId: 1 } as any);
            expect(getState().result).toEqual({ attemptId: 1 });

            getState().setBulkSent(1);
            expect(getState().bulkSentAttemptId).toBe(1);

            getState().setBulkSent(null);
            expect(getState().bulkSentAttemptId).toBeNull();
        });
    });

    describe('resetAll', () => {
        test('resetAll returns to initial state', () => {
            useQuizPlayerStore.setState({
                quizId: 123,
                quizVersionId: 456,
                attemptId: 1,
                guestToken: 't',
                status: 'in-progress',
                error: 'e',
                currentIndex: 9,
                totalQuestions: 10,
                answersByQuestionId: { 1: 2 },
                result: { attemptId: 1 } as any,
                bulkSentAttemptId: 1,
            });

            getState().resetAll();

            const s = getState();
            expect(s.quizId).toBe(0);
            expect(s.quizVersionId).toBeNull();
            expect(s.attemptId).toBeNull();
            expect(s.guestToken).toBeNull();
            expect(s.status).toBe('idle');
            expect(s.error).toBeNull();
            expect(s.currentIndex).toBe(0);
            expect(s.totalQuestions).toBeNull();
            expect(s.answersByQuestionId).toEqual({});
            expect(s.result).toBeNull();
            expect(s.bulkSentAttemptId).toBeNull();
        });
    });

    describe('persist / rehydrate', () => {
        test('rehydrate loads persisted fields but forces status=idle and error=null', async () => {
            const persisted = {
                state: {
                    quizId: 9,
                    quizVersionId: 99,
                    attemptId: 100,
                    guestToken: 'guest',
                    currentIndex: 1,
                    totalQuestions: 10,
                    answersByQuestionId: { 1: 2 },
                    result: null,
                    bulkSentAttemptId: 100,
                },
                version: 2,
            };

            useQuizPlayerStore.setState({ status: 'error', error: 'boom' });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

            await (useQuizPlayerStore as any).persist.rehydrate();

            const s = getState();
            expect(s.quizId).toBe(9);
            expect(s.quizVersionId).toBe(99);
            expect(s.attemptId).toBe(100);
            expect(s.guestToken).toBe('guest');
            expect(s.currentIndex).toBe(1);
            expect(s.totalQuestions).toBe(10);
            expect(s.answersByQuestionId).toEqual({ 1: 2 });
            expect(s.bulkSentAttemptId).toBe(100);

            expect(s.status).toBe('idle');
            expect(s.error).toBeNull();
        });
    });

});
