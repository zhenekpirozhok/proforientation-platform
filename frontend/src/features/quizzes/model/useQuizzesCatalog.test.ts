import { useQuizzesCatalog } from './useQuizzesCatalog';

jest.mock('react', () => ({
    useMemo: (fn: any) => fn(),
}));

const useQuizzesMock = jest.fn();
const useGetAllMetricsMock = jest.fn();
const useCategoriesMock = jest.fn();

jest.mock('@/entities/quiz/api/useQuizzes', () => ({
    useQuizzes: (p: any) => useQuizzesMock(p),
}), { virtual: true });

jest.mock('@/shared/api/generated/api', () => ({
    useGetAllMetrics: (p: any) => useGetAllMetricsMock(p),
}), { virtual: true });

jest.mock('@/entities/category/api/useCategories', () => ({
    useCategories: () => useCategoriesMock(),
}), { virtual: true });

function makeQuery(overrides: Partial<any> = {}) {
    return {
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        ...overrides,
    };
}

describe('useQuizzesCatalog', () => {
    beforeEach(() => {
        useQuizzesMock.mockReset();
        useGetAllMetricsMock.mockReset();
        useCategoriesMock.mockReset();
    });

    test('joins quizzes with metrics and categories (by quizId and categoryId)', () => {
        useQuizzesMock.mockReturnValueOnce(
            makeQuery({
                data: {
                    content: [
                        { id: 1, title: 'A' },
                        { id: 2, title: 'B' },
                        { id: 'x', title: 'bad' },
                    ],
                    totalElements: 3,
                },
            }),
        );

        useGetAllMetricsMock.mockReturnValueOnce(
            makeQuery({
                data: [
                    { quizId: 1, categoryId: 10, questionsTotal: 5 },
                    { quizId: 2, categoryId: null, questionsTotal: 7 },
                ],
            }),
        );

        useCategoriesMock.mockReturnValueOnce(
            makeQuery({
                data: [
                    { id: 10, name: 'Cat10' },
                    { id: 11, name: 'Cat11' },
                ],
            }),
        );

        const out = useQuizzesCatalog({
            page: 0,
            size: 10,
            filters: { q: '', category: 'all', duration: 'all' },
        });

        expect(out.items.length).toBe(2);
        expect(out.items.find((x: any) => x.id === 1)?.title).toBe('A');
        expect(out.items.find((x: any) => x.id === 2)?.title).toBe('B');
    });

    test('extractItems supports array response', () => {
        useQuizzesMock.mockReturnValueOnce(
            makeQuery({
                data: [{ id: 1, title: 'A' }],
            }),
        );
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        const out = useQuizzesCatalog({
            page: 0,
            size: 10,
            filters: { q: '', category: 'all', duration: 'all' },
        });

        expect(out.items.length).toBe(1);
        expect(out.items[0].id).toBe(1);
    });

    test('filters by search query (case-insensitive, trims)', () => {
        useQuizzesMock.mockReturnValueOnce(
            makeQuery({
                data: {
                    items: [
                        { id: 1, title: 'Java Basics' },
                        { id: 2, title: 'TypeScript' },
                        { id: 3, title: null },
                    ],
                    total: 3,
                },
            }),
        );
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        const out = useQuizzesCatalog({
            page: 0,
            size: 10,
            filters: { q: '  java  ', category: 'all', duration: 'all' },
        });

        expect(out.items.map((x: any) => x.id)).toEqual([1]);
    });

    test('filters by category when category != all', () => {
        useQuizzesMock.mockReturnValueOnce(
            makeQuery({
                data: [
                    { id: 1, title: 'A' },
                    { id: 2, title: 'B' },
                ],
            }),
        );

        useGetAllMetricsMock.mockReturnValueOnce(
            makeQuery({
                data: [
                    { quizId: 1, categoryId: 10 },
                    { quizId: 2, categoryId: 11 },
                ],
            }),
        );

        useCategoriesMock.mockReturnValueOnce(
            makeQuery({
                data: [
                    { id: 10, name: 'Cat10' },
                    { id: 11, name: 'Cat11' },
                ],
            }),
        );

        const out = useQuizzesCatalog({
            page: 0,
            size: 10,
            filters: { q: '', category: '10', duration: 'all' },
        });

        expect(out.items.map((x: any) => x.id)).toEqual([1]);
    });

    test('total uses totalElements or total and falls back to 0', () => {
        useQuizzesMock.mockReturnValueOnce(makeQuery({ data: { totalElements: 42 } }));
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        const out1 = useQuizzesCatalog({
            page: 0,
            size: 10,
            filters: { q: '', category: 'all', duration: 'all' },
        });
        expect(out1.total).toBe(42);

        useQuizzesMock.mockReturnValueOnce(makeQuery({ data: { total: 7 } }));
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        const out2 = useQuizzesCatalog({
            page: 0,
            size: 10,
            filters: { q: '', category: 'all', duration: 'all' },
        });
        expect(out2.total).toBe(7);

        useQuizzesMock.mockReturnValueOnce(makeQuery({ data: null }));
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        const out3 = useQuizzesCatalog({
            page: 0,
            size: 10,
            filters: { q: '', category: 'all', duration: 'all' },
        });
        expect(out3.total).toBe(0);
    });

    test('isLoading is OR of queries; errors are exposed', () => {
        const eQ = new Error('quizzes');
        const eM = new Error('metrics');
        const eC = new Error('categories');

        useQuizzesMock.mockReturnValueOnce(makeQuery({ isLoading: false, error: eQ }));
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ isLoading: true, error: eM }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ isLoading: false, error: eC }));

        const out = useQuizzesCatalog({
            page: 0,
            size: 10,
            filters: { q: '', category: 'all', duration: 'all' },
        });

        expect(out.isLoading).toBe(true);
        expect(out.quizzesError).toBe(eQ);
        expect(out.metricsError).toBe(eM);
        expect(out.categoriesError).toBe(eC);
    });

    test('refetch calls all refetch functions', () => {
        const q1 = makeQuery();
        const q2 = makeQuery();
        const q3 = makeQuery();

        useQuizzesMock.mockReturnValueOnce(q1);
        useGetAllMetricsMock.mockReturnValueOnce(q2);
        useCategoriesMock.mockReturnValueOnce(q3);

        const out = useQuizzesCatalog({
            page: 0,
            size: 10,
            filters: { q: '', category: 'all', duration: 'all' },
        });

        out.refetch();

        expect(q1.refetch).toHaveBeenCalledTimes(1);
        expect(q2.refetch).toHaveBeenCalledTimes(1);
        expect(q3.refetch).toHaveBeenCalledTimes(1);
    });

    test('passes expected options to useGetAllMetrics', () => {
        useQuizzesMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        useQuizzesCatalog({
            page: 1,
            size: 20,
            filters: { q: '', category: 'all', duration: 'all' },
        });

        expect(useGetAllMetricsMock).toHaveBeenCalledTimes(1);
        expect(useGetAllMetricsMock.mock.calls[0][0]).toEqual({
            query: { staleTime: 60_000, gcTime: 5 * 60_000 },
        });
    });
});
