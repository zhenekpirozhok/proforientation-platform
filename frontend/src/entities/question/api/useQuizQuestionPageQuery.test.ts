import { useQuizQuestionPageQuery } from './useQuizQuestionPageQuery';

const useQueryMock = jest.fn();

jest.mock('@tanstack/react-query', () => ({
    useQuery: (args: any) => useQueryMock(args),
    keepPreviousData: {},
}));

const getQuestionsForQuizMock = jest.fn();

jest.mock(
    '@/shared/api/generated/api',
    () => ({
        getQuestionsForQuiz: (...args: any[]) => getQuestionsForQuizMock(...args),
    }),
    { virtual: true },
);

jest.mock('./queryKeys', () => ({
    quizQuestionPageKey: (quizId: number, page: number, locale: string) => [
        'qq',
        quizId,
        page,
        locale,
    ],
}));

describe('useQuizQuestionPageQuery', () => {
    beforeEach(() => {
        useQueryMock.mockReset();
        getQuestionsForQuizMock.mockReset();
    });

    test('passes correct queryKey and enabled=true when params are valid', () => {
        useQueryMock.mockReturnValue({ ok: true });

        const res = useQuizQuestionPageQuery({ quizId: 10, page: 0, locale: 'en' });

        expect(res).toEqual({ ok: true });

        expect(useQueryMock).toHaveBeenCalledTimes(1);
        const arg = useQueryMock.mock.calls[0][0];

        expect(arg.queryKey).toEqual(['qq', 10, 0, 'en']);
        expect(arg.enabled).toBe(true);
        expect(arg.staleTime).toBe(30_000);
        expect(typeof arg.queryFn).toBe('function');
    });

    test('enabled=false when quizId is invalid', () => {
        useQueryMock.mockReturnValue({ ok: true });

        useQuizQuestionPageQuery({ quizId: 0, page: 0, locale: 'en' });

        const arg = useQueryMock.mock.calls[0][0];
        expect(arg.enabled).toBe(false);
    });

    test('enabled=false when page is negative', () => {
        useQueryMock.mockReturnValue({ ok: true });

        useQuizQuestionPageQuery({ quizId: 10, page: -1, locale: 'en' });

        const arg = useQueryMock.mock.calls[0][0];
        expect(arg.enabled).toBe(false);
    });

    test('enabled=false when locale is empty', () => {
        useQueryMock.mockReturnValue({ ok: true });

        useQuizQuestionPageQuery({ quizId: 10, page: 0, locale: '' });

        const arg = useQueryMock.mock.calls[0][0];
        expect(arg.enabled).toBe(false);
    });

    test('queryFn calls getQuestionsForQuiz with page+1 and size=1 and x-locale header', async () => {
        useQueryMock.mockReturnValue({ ok: true });
        getQuestionsForQuizMock.mockResolvedValueOnce([{ id: 1 }]);

        useQuizQuestionPageQuery({ quizId: 10, page: 2, locale: 'lt' });

        const { queryFn } = useQueryMock.mock.calls[0][0];
        const signal = {} as AbortSignal;

        await queryFn({ signal });

        expect(getQuestionsForQuizMock).toHaveBeenCalledTimes(1);
        const [quizId, params, init] = getQuestionsForQuizMock.mock.calls[0];

        expect(quizId).toBe(10);
        expect(params).toEqual({ page: '3', size: '1' });
        expect(init).toEqual({
            signal,
            headers: { 'x-locale': 'lt' },
        });
    });

    test('queryFn normalizes array response to {question,total}', async () => {
        useQueryMock.mockReturnValue({ ok: true });
        getQuestionsForQuizMock.mockResolvedValueOnce([{ id: 123 }, { id: 456 }]);

        useQuizQuestionPageQuery({ quizId: 10, page: 0, locale: 'en' });

        const { queryFn } = useQueryMock.mock.calls[0][0];

        const out = await queryFn({ signal: undefined });

        expect(out).toEqual({
            question: { id: 123 },
            total: 2,
        });
    });

    test('queryFn normalizes PageLike response to {question,total}', async () => {
        useQueryMock.mockReturnValue({ ok: true });
        getQuestionsForQuizMock.mockResolvedValueOnce({
            content: [{ id: 999 }],
            totalElements: 50,
        });

        useQuizQuestionPageQuery({ quizId: 10, page: 0, locale: 'en' });

        const { queryFn } = useQueryMock.mock.calls[0][0];

        const out = await queryFn({ signal: undefined });

        expect(out).toEqual({
            question: { id: 999 },
            total: 50,
        });
    });

    test('PageLike: if content is not array, returns question null and total undefined', async () => {
        useQueryMock.mockReturnValue({ ok: true });
        getQuestionsForQuizMock.mockResolvedValueOnce({
            content: null,
            totalElements: 'nope',
        });

        useQuizQuestionPageQuery({ quizId: 10, page: 0, locale: 'en' });

        const { queryFn } = useQueryMock.mock.calls[0][0];

        const out = await queryFn({ signal: undefined });

        expect(out).toEqual({
            question: null,
            total: undefined,
        });
    });
});
