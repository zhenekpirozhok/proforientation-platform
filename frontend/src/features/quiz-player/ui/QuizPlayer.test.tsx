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

type ParamsMock = { locale: string };
const paramsMock: ParamsMock = { locale: 'lt' };

jest.mock(
  'next/navigation',
  () => ({
    useParams: () => paramsMock,
  }),
  { virtual: true },
);

type TranslationVars = { message?: string };

jest.mock(
  'next-intl',
  () => ({
    useTranslations: () => (key: string, vars?: TranslationVars) =>
      vars?.message ? `${key}:${vars.message}` : key,
    useLocale: () => paramsMock.locale,
  }),
  { virtual: true },
);

type ChildrenProps = { children?: React.ReactNode };

jest.mock('./components/QuizPlayerLayout', () => ({
  QuizPlayerLayout: ({ children }: ChildrenProps) => <div>{children}</div>,
}));

type ProgressHeaderProps = { current: number; total?: number | null };

jest.mock('./components/QuizProgressHeader', () => ({
  QuizProgressHeader: ({ current, total }: ProgressHeaderProps) => (
    <div>
      {current}/{total ?? 'null'}
    </div>
  ),
}));

jest.mock('./components/QuizPlayerSkeleton', () => ({
  QuizPlayerSkeleton: () => <div>loading</div>,
}));

jest.mock('./components/AnimatedQuestion', () => ({
  AnimatedQuestion: ({ children }: ChildrenProps) => <div>{children}</div>,
}));

type Question = { id: number };
type QuestionCardProps = {
  question: Question;
  selectedOptionId?: number | null;
  onSelect: (questionId: number, optionId: number) => void;
  disabled?: boolean;
};

jest.mock(
  '@/entities/question/ui/QuestionCard',
  () => ({
    QuestionCard: ({
      question,
      selectedOptionId,
      onSelect,
      disabled,
    }: QuestionCardProps) => (
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

type QuizPlayerActionsProps = {
  backDisabled?: boolean;
  nextDisabled?: boolean;
  submitDisabled?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

jest.mock('./components/QuizPlayerActions', () => ({
  QuizPlayerActions: (p: QuizPlayerActionsProps) => (
    <div>
      <button disabled={p.backDisabled} onClick={p.onBack}>
        back
      </button>
      <button disabled={p.nextDisabled} onClick={p.onNext}>
        next
      </button>
      <button disabled={p.submitDisabled} onClick={p.onSubmit}>
        submit
      </button>
    </div>
  ),
}));

type VersionQueryMock = {
  data: number | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
};

const versionQueryMock: VersionQueryMock = {
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

type BatchData = {
  questions: Array<{ id: number }>;
  total: number;
  last: boolean;
};

type BatchQueryMock = {
  data: BatchData | null;
  isError: boolean;
  error: unknown;
  isLoading: boolean;
};

const batchQueryMock: BatchQueryMock = {
  data: null,
  isError: false,
  error: null,
  isLoading: false,
};

type QueryClientMock = {
  getQueryData: jest.Mock;
  prefetchQuery: jest.Mock<Promise<void>, [unknown]>;
};

const qcMock: QueryClientMock = {
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

jest.mock('@/shared/api/parseResponse', () => ({ parseResponse: jest.fn() }), {
  virtual: true,
});

type StartAttemptResult = { attemptId: number; guestToken?: string | null };

const startAttemptMutateAsync = jest.fn<
  Promise<StartAttemptResult>,
  [unknown]
>();
const addAnswersBulkMutateAsync = jest.fn<Promise<unknown>, [unknown]>();
const submitMutateAsync = jest.fn<Promise<unknown>, [unknown]>();

jest.mock(
  '@/shared/api/generated/api',
  () => ({
    useStartAttempt: () => ({ mutateAsync: startAttemptMutateAsync }),
    useAddAnswersBulk: () => ({
      mutateAsync: addAnswersBulkMutateAsync,
      isPending: false,
    }),
    useSubmit: () => ({ mutateAsync: submitMutateAsync, isPending: false }),
  }),
  { virtual: true },
);

type GuestStoreState = { guestToken: string | null };
const guestStoreState: GuestStoreState = { guestToken: null };

const setGuestTokenMock = jest.fn<void, [string | null]>((t) => {
  guestStoreState.guestToken = t;
});

const clearGuestTokenMock = jest.fn<void, []>(() => {
  guestStoreState.guestToken = null;
});

type GuestStoreSelectors =
  | GuestStoreState
  | {
      guestToken: string | null;
      setGuestToken: (t: string | null) => void;
      clearGuestToken: () => void;
    };

type GuestSelector<T> = (s: GuestStoreSelectors) => T;

type GuestStoreMockFn = (<T>(
  sel?: GuestSelector<T>,
) => T | GuestStoreSelectors) & {
  getState: () => GuestStoreSelectors;
};

const useGuestStoreMock = jest.fn((sel?: GuestSelector<unknown>) => {
  const full: GuestStoreSelectors = {
    guestToken: guestStoreState.guestToken,
    setGuestToken: setGuestTokenMock,
    clearGuestToken: clearGuestTokenMock,
  };
  if (typeof sel === 'function') return sel(full);
  return full;
}) as unknown as GuestStoreMockFn;

useGuestStoreMock.getState = () => ({
  guestToken: guestStoreState.guestToken,
  setGuestToken: setGuestTokenMock,
  clearGuestToken: clearGuestTokenMock,
});

jest.mock(
  '@/entities/guest/model/store',
  () => ({
    useGuestStore: useGuestStoreMock,
  }),
  { virtual: true },
);

type QuizPlayerStatus = 'idle' | 'in-progress' | 'error';

type QuizPlayerStoreState = {
  quizId: number;
  quizVersionId: number | null;
  attemptId: number | null;
  guestToken: string | null;
  status: QuizPlayerStatus;
  error: string | null;
  currentIndex: number;
  totalQuestions: number | null;
  answersByQuestionId: Record<number, number>;
  bulkSentAttemptId: number | null;
};

let storeState: QuizPlayerStoreState;

const storeActions = {
  resumeOrStart: jest.fn<void, []>(),
  setAttempt: jest.fn<void, [number, string]>((id, token) => {
    storeState.attemptId = id;
    storeState.guestToken = token;
    storeState.status = 'in-progress';
  }),
  setStatus: jest.fn<void, [QuizPlayerStatus]>((s) => {
    storeState.status = s;
  }),
  setError: jest.fn<void, [string]>((e) => {
    storeState.error = e;
    storeState.status = 'error';
  }),
  setTotalQuestions: jest.fn<void, [number]>((t) => {
    storeState.totalQuestions = t;
  }),
  goNext: jest.fn<void, []>(() => {
    storeState.currentIndex++;
  }),
  goPrev: jest.fn<void, []>(() => {
    storeState.currentIndex--;
  }),
  selectOption: jest.fn<void, [number, number]>((qid, oid) => {
    storeState.answersByQuestionId[qid] = oid;
  }),
  setResult: jest.fn<void, [unknown]>(),
  setBulkSent: jest.fn<void, [number]>((id) => {
    storeState.bulkSentAttemptId = id;
  }),
};

type QuizPlayerStoreFull = QuizPlayerStoreState & typeof storeActions;
type QuizPlayerSelector<T> = (s: QuizPlayerStoreFull) => T;

type QuizPlayerStoreMockFn = (<T>(
  sel?: QuizPlayerSelector<T>,
) => T | QuizPlayerStoreFull) & {
  getState: () => QuizPlayerStoreState;
};

const useQuizPlayerStoreMock = jest.fn((sel?: QuizPlayerSelector<unknown>) => {
  const state: QuizPlayerStoreFull = { ...storeState, ...storeActions };
  if (typeof sel === 'function') return sel(state);
  return state;
}) as unknown as QuizPlayerStoreMockFn;

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

  guestStoreState.guestToken = null;
  setGuestTokenMock.mockClear();
  clearGuestTokenMock.mockClear();

  qcMock.getQueryData.mockClear();
  qcMock.prefetchQuery.mockClear();

  paramsMock.locale = 'lt';

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

  (Object.values(storeActions) as Array<jest.Mock>).forEach((fn) =>
    fn.mockClear(),
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
    versionQueryMock.data = 10;

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
      expect(pushMock).toHaveBeenCalledWith('/results');
    });
  });

  test('stores guestToken from startAttempt into guest-store when provided', async () => {
    versionQueryMock.data = 10;

    startAttemptMutateAsync.mockResolvedValueOnce({
      attemptId: 37,
      guestToken: 'b963978b-a863-4445-bdc0-e58fe71bd5b6',
    });

    batchQueryMock.data = {
      questions: [{ id: 1 }],
      total: 1,
      last: true,
    };

    render(<QuizPlayer quizId={1} />);

    await waitFor(() => {
      expect(setGuestTokenMock).toHaveBeenCalledWith(
        'b963978b-a863-4445-bdc0-e58fe71bd5b6',
      );
    });
  });
});
