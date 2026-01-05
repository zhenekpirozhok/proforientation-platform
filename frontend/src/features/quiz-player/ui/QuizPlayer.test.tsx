import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const pushMock = jest.fn();

jest.mock(
  '@/shared/i18n/lib/navigation',
  () => ({
    useRouter: () => ({ push: pushMock }),
  }),
  { virtual: true },
);

jest.mock(
  'next-intl',
  () => ({
    useTranslations: () => (key: string, vars?: any) =>
      vars?.message ? `${key}:${vars.message}` : key,
  }),
  { virtual: true },
);

jest.mock('./components/QuizPlayerLayout', () => ({
  QuizPlayerLayout: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('./components/QuizProgressHeader', () => ({
  QuizProgressHeader: ({ current, total }: any) => (
    <div>{current}/{total ?? 'null'}</div>
  ),
}));

jest.mock('./components/QuizPlayerSkeleton', () => ({
  QuizPlayerSkeleton: () => <div>loading</div>,
}));

jest.mock('./components/AnimatedQuestion', () => ({
  AnimatedQuestion: ({ children }: any) => <div>{children}</div>,
}));

jest.mock(
  '@/entities/question/ui/QuestionCard',
  () => ({
    QuestionCard: ({ question, selectedOptionId, onSelect, disabled }: any) => (
      <div>
        <div>{question.id}</div>
        <div>{selectedOptionId ?? 'none'}</div>
        <button disabled={disabled} onClick={() => onSelect(question.id, 101)}>
          select
        </button>
      </div>
    ),
  }),
  { virtual: true },
);

jest.mock('./components/QuizPlayerActions', () => ({
  QuizPlayerActions: (p: any) => (
    <div>
      <button disabled={p.backDisabled} onClick={p.onBack}>back</button>
      <button disabled={p.nextDisabled} onClick={p.onNext}>next</button>
      <button disabled={p.submitDisabled} onClick={p.onSubmit}>submit</button>
    </div>
  ),
}));

const versionQueryMock: any = {
  data: null,
  isLoading: false,
  isError: false,
  error: null,
};

jest.mock(
  '../model/useCurrentQuizVersionIdQuery',
  () => ({
    useCurrentQuizVersionIdQuery: () => versionQueryMock,
  }),
  { virtual: true },
);

const batchQueryMock: any = {
  data: null,
  isError: false,
  error: null,
  isLoading: false,
};

const qcMock = {
  getQueryData: jest.fn(),
  prefetchQuery: jest.fn().mockResolvedValue(undefined),
};

jest.mock(
  '@tanstack/react-query',
  () => ({
    useQuery: () => batchQueryMock,
    useQueryClient: () => qcMock,
    keepPreviousData: {},
  }),
  { virtual: true },
);

jest.mock(
  '@/shared/api/parseResponse',
  () => ({ parseResponse: jest.fn() }),
  { virtual: true },
);

const startAttemptMutateAsync = jest.fn();
const addAnswersBulkMutateAsync = jest.fn();
const submitMutateAsync = jest.fn();

jest.mock(
  '@/shared/api/generated/api',
  () => ({
    useStartAttempt: () => ({ mutateAsync: startAttemptMutateAsync }),
    useAddAnswersBulk: () => ({ mutateAsync: addAnswersBulkMutateAsync, isPending: false }),
    useSubmit: () => ({ mutateAsync: submitMutateAsync, isPending: false }),
  }),
  { virtual: true },
);

let storeState: any;

const storeActions = {
  resumeOrStart: jest.fn(),
  setAttempt: jest.fn((id: number, token: string) => {
    storeState.attemptId = id;
    storeState.guestToken = token;
    storeState.status = 'in-progress';
  }),
  setStatus: jest.fn((s: any) => { storeState.status = s; }),
  setError: jest.fn((e: any) => { storeState.error = e; storeState.status = 'error'; }),
  setTotalQuestions: jest.fn((t: number) => { storeState.totalQuestions = t; }),
  goNext: jest.fn(() => { storeState.currentIndex++; }),
  goPrev: jest.fn(() => { storeState.currentIndex--; }),
  selectOption: jest.fn((qid: number, oid: number) => {
    storeState.answersByQuestionId[qid] = oid;
  }),
  setResult: jest.fn(),
  setBulkSent: jest.fn((id: number) => { storeState.bulkSentAttemptId = id; }),
};

const useQuizPlayerStoreMock: any = jest.fn(() => ({
  ...storeState,
  ...storeActions,
}));

useQuizPlayerStoreMock.getState = () => storeState;

jest.mock(
  '../model/store',
  () => ({
    useQuizPlayerStore: useQuizPlayerStoreMock,
  }),
  { virtual: true },
);

import { QuizPlayer } from './QuizPlayer';

function reset() {
  pushMock.mockClear();
  startAttemptMutateAsync.mockReset();
  addAnswersBulkMutateAsync.mockReset();
  submitMutateAsync.mockReset();

  Object.assign(versionQueryMock, {
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  });

  Object.assign(batchQueryMock, {
    data: null,
    isError: false,
    error: null,
    isLoading: false,
  });

  storeState = {
    quizId: 0,
    quizVersionId: null,
    attemptId: null,
    guestToken: null,
    status: 'idle',
    error: null,
    currentIndex: 0,
    totalQuestions: null,
    answersByQuestionId: {},
    bulkSentAttemptId: null,
  };

  Object.values(storeActions).forEach(
    (fn) => typeof fn === 'function' && (fn as any).mockClear(),
  );
}

describe('QuizPlayer', () => {
  beforeEach(reset);

  test('shows skeleton while version is loading', () => {
    versionQueryMock.isLoading = true;
    render(<QuizPlayer quizId={1} />);
    expect(screen.queryByText('loading')).not.toBeNull();
  });

  test('shows error from store', () => {
    storeState.status = 'error';
    storeState.error = 'Boom';
    render(<QuizPlayer quizId={1} />);
    expect(screen.queryByText('errorGeneric:Boom')).not.toBeNull();
  });

  test('submit flow works', async () => {
    storeState.quizVersionId = 10;
    storeState.attemptId = 7;
    storeState.guestToken = 'gt';
    storeState.status = 'in-progress';

    batchQueryMock.data = {
      questions: [{ id: 1 }],
      total: 1,
      last: true,
    };

    storeState.totalQuestions = 1;
    storeState.answersByQuestionId = { 1: 101 };

    addAnswersBulkMutateAsync.mockResolvedValueOnce({});
    submitMutateAsync.mockResolvedValueOnce({});

    render(<QuizPlayer quizId={1} />);

    fireEvent.click(screen.getByText('submit'));

    await waitFor(() => {
      expect(addAnswersBulkMutateAsync).toHaveBeenCalled();
      expect(submitMutateAsync).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/results/7');
    });
  });
});
