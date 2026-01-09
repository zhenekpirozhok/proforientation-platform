import { useQuizDetails } from './useQuizDetails';

type QueryResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: jest.Mock;
};

jest.mock('react', () => ({
  useMemo: <T>(fn: () => T) => fn(),
}));

const useQuizMock = jest.fn();
const useQuizMetricsMock = jest.fn();
const useCurrentQuizVersionMock = jest.fn();

jest.mock('./useQuiz', () => ({
  useQuiz: (quizId: number) => useQuizMock(quizId),
}));

jest.mock('./useQuizMetrics', () => ({
  useQuizMetrics: (quizId: number) => useQuizMetricsMock(quizId),
}));

jest.mock('./useCurrentQuizVersion', () => ({
  useCurrentQuizVersion: (quizId: number) => useCurrentQuizVersionMock(quizId),
}));

function makeQuery<T>(overrides: Partial<QueryResult<T>> = {}): QueryResult<T> {
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  };
}

describe('useQuizDetails', () => {
  beforeEach(() => {
    useQuizMock.mockReset();
    useQuizMetricsMock.mockReset();
    useCurrentQuizVersionMock.mockReset();
  });

  test('aggregates data and nulls', () => {
    useQuizMock.mockReturnValueOnce(makeQuery({ data: { id: 1 } }));
    useQuizMetricsMock.mockReturnValueOnce(
      makeQuery({ data: { questionsTotal: 5 } }),
    );
    useCurrentQuizVersionMock.mockReturnValueOnce(
      makeQuery({ data: { id: 10 } }),
    );

    const out = useQuizDetails(123);

    expect(out.quiz).toEqual({ id: 1 });
    expect(out.metrics).toEqual({ questionsTotal: 5 });
    expect(out.version).toEqual({ id: 10 });

    expect(out.questionCount).toBe(5);
    expect(out.estimatedMinutes).toBeNull();

    expect(out.isLoading).toBe(false);
    expect(out.error).toBeNull();
  });

  test('isLoading is OR of all queries', () => {
    useQuizMock.mockReturnValueOnce(makeQuery({ isLoading: false }));
    useQuizMetricsMock.mockReturnValueOnce(makeQuery({ isLoading: true }));
    useCurrentQuizVersionMock.mockReturnValueOnce(
      makeQuery({ isLoading: false }),
    );

    const out = useQuizDetails(1);
    expect(out.isLoading).toBe(true);
  });

  test('error is first truthy among queries', () => {
    const e1 = new Error('quiz');
    const e2 = new Error('metrics');
    const e3 = new Error('version');

    useQuizMock.mockReturnValueOnce(makeQuery({ error: e1 }));
    useQuizMetricsMock.mockReturnValueOnce(makeQuery({ error: e2 }));
    useCurrentQuizVersionMock.mockReturnValueOnce(makeQuery({ error: e3 }));

    const out = useQuizDetails(1);
    expect(out.error).toBe(e1);

    useQuizMock.mockReturnValueOnce(makeQuery({ error: null }));
    useQuizMetricsMock.mockReturnValueOnce(makeQuery({ error: e2 }));
    useCurrentQuizVersionMock.mockReturnValueOnce(makeQuery({ error: e3 }));

    const out2 = useQuizDetails(1);
    expect(out2.error).toBe(e2);
  });

  test('questionCount is null when not a number', () => {
    useQuizMock.mockReturnValueOnce(makeQuery({ data: { id: 1 } }));
    useQuizMetricsMock.mockReturnValueOnce(
      makeQuery({ data: { questionsTotal: '5' } }),
    );
    useCurrentQuizVersionMock.mockReturnValueOnce(
      makeQuery({ data: { id: 10 } }),
    );

    const out = useQuizDetails(1);
    expect(out.questionCount).toBeNull();
  });

  test('estimatedMinutes is rounded seconds/60 and minimum 1', () => {
    useQuizMock.mockReturnValueOnce(makeQuery());
    useQuizMetricsMock.mockReturnValueOnce(
      makeQuery({ data: { estimatedDurationSeconds: 1 } }),
    );
    useCurrentQuizVersionMock.mockReturnValueOnce(makeQuery());
    const out = useQuizDetails(1);
    expect(out.estimatedMinutes).toBe(1);

    useQuizMock.mockReturnValueOnce(makeQuery());
    useQuizMetricsMock.mockReturnValueOnce(
      makeQuery({ data: { estimatedDurationSeconds: 30 } }),
    );
    useCurrentQuizVersionMock.mockReturnValueOnce(makeQuery());
    const out2 = useQuizDetails(1);
    expect(out2.estimatedMinutes).toBe(1);

    useQuizMock.mockReturnValueOnce(makeQuery());
    useQuizMetricsMock.mockReturnValueOnce(
      makeQuery({ data: { estimatedDurationSeconds: 89 } }),
    );
    useCurrentQuizVersionMock.mockReturnValueOnce(makeQuery());
    const out3 = useQuizDetails(1);
    expect(out3.estimatedMinutes).toBe(1);

    useQuizMock.mockReturnValueOnce(makeQuery());
    useQuizMetricsMock.mockReturnValueOnce(
      makeQuery({ data: { estimatedDurationSeconds: 90 } }),
    );
    useCurrentQuizVersionMock.mockReturnValueOnce(makeQuery());
    const out4 = useQuizDetails(1);
    expect(out4.estimatedMinutes).toBe(2);

    useQuizMock.mockReturnValueOnce(makeQuery());
    useQuizMetricsMock.mockReturnValueOnce(
      makeQuery({ data: { estimatedDurationSeconds: 119 } }),
    );
    useCurrentQuizVersionMock.mockReturnValueOnce(makeQuery());
    const out5 = useQuizDetails(1);
    expect(out5.estimatedMinutes).toBe(2);
  });

  test('refetchAll calls refetch on all queries', () => {
    const q1 = makeQuery();
    const q2 = makeQuery();
    const q3 = makeQuery();

    useQuizMock.mockReturnValueOnce(q1);
    useQuizMetricsMock.mockReturnValueOnce(q2);
    useCurrentQuizVersionMock.mockReturnValueOnce(q3);

    const out = useQuizDetails(1);

    out.refetchAll();

    expect(q1.refetch).toHaveBeenCalledTimes(1);
    expect(q2.refetch).toHaveBeenCalledTimes(1);
    expect(q3.refetch).toHaveBeenCalledTimes(1);
  });
});
