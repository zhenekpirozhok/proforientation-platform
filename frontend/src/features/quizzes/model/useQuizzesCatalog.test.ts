import { useQuizzesCatalog } from './useQuizzesCatalog';

jest.mock('react', () => ({
    useMemo: (fn: any) => fn(),
}));

const useQuizzesMock = jest.fn();
const useSearchQuizzesLocalizedMock = jest.fn();
const useGetAllMetricsMock = jest.fn();
const useCategoriesMock = jest.fn();
const useDebounceMock = jest.fn((v: any) => v);

jest.mock('@/entities/quiz/api/useQuizzes', () => ({
    useQuizzes: (p: any) => useQuizzesMock(p),
}), { virtual: true });

jest.mock('@/entities/quiz/api/useSearchQuizzes', () => ({
    useSearchQuizzesLocalized: (l: any, p: any) =>
        useSearchQuizzesLocalizedMock(l, p),
}), { virtual: true });

jest.mock('@/shared/api/generated/api', () => ({
    useGetAllMetrics: (p: any) => useGetAllMetricsMock(p),
}), { virtual: true });

jest.mock('@/entities/category/api/useCategories', () => ({
    useCategories: (l: any) => useCategoriesMock(l),
}), { virtual: true });

jest.mock('@/shared/lib/useDebounce', () => ({
    useDebounce: (v: any) => useDebounceMock(v),
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
        useSearchQuizzesLocalizedMock.mockReset();
        useGetAllMetricsMock.mockReset();
        useCategoriesMock.mockReset();
        useDebounceMock.mockClear();
    });

    test('joins quizzes with metrics and categories', () => {
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

        useSearchQuizzesLocalizedMock.mockReturnValueOnce(makeQuery());

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
            locale: 'en',
            page: 0,
            size: 10,
            filters: { search: '', category: 'all', duration: 'any' },
        });

        expect(out.items.map((x: any) => x.id)).toEqual([1, 2]);
    });

    test('extractItems supports array response', () => {
        useQuizzesMock.mockReturnValueOnce(
            makeQuery({
                data: [{ id: 1, title: 'A' }],
            }),
        );

        useSearchQuizzesLocalizedMock.mockReturnValueOnce(makeQuery());
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        const out = useQuizzesCatalog({
            locale: 'en',
            page: 0,
            size: 10,
            filters: { search: '', category: 'all', duration: 'any' },
        });

        expect(out.items.length).toBe(1);
        expect(out.items[0].id).toBe(1);
    });

    test('local search filters when length < 2', () => {
        useQuizzesMock.mockReturnValueOnce(
            makeQuery({
                data: {
                    items: [
                        { id: 1, title: 'Java Basics' },
                        { id: 2, title: 'TypeScript' },
                    ],
                },
            }),
        );

        useSearchQuizzesLocalizedMock.mockReturnValueOnce(makeQuery());
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        const out = useQuizzesCatalog({
            locale: 'en',
            page: 0,
            size: 10,
            filters: { search: 'j', category: 'all', duration: 'any' },
        });

        expect(out.items.map((x: any) => x.id)).toEqual([1]);
    });


    test('uses search API when search length >= 2', () => {
        useQuizzesMock.mockReturnValueOnce(makeQuery());

        useSearchQuizzesLocalizedMock.mockReturnValueOnce(
            makeQuery({
                data: {
                    content: [{ id: 3, title: 'React' }],
                    totalElements: 1,
                },
            }),
        );

        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        const out = useQuizzesCatalog({
            locale: 'en',
            page: 0,
            size: 10,
            filters: { search: 'react', category: 'all', duration: 'any' },
        });

        expect(useSearchQuizzesLocalizedMock).toHaveBeenCalled();
        expect(out.items.map((x: any) => x.id)).toEqual([3]);
    });

    test('filters by category', () => {
        useQuizzesMock.mockReturnValueOnce(
            makeQuery({
                data: [
                    { id: 1, title: 'A' },
                    { id: 2, title: 'B' },
                ],
            }),
        );

        useSearchQuizzesLocalizedMock.mockReturnValueOnce(
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
            locale: 'en',
            page: 0,
            size: 10,
            filters: { search: '', category: '10', duration: 'any' },
        });

        expect(useSearchQuizzesLocalizedMock).toHaveBeenCalled();
        expect(out.items.map((x: any) => x.id)).toEqual([1]);
    });


    test('total uses totalElements or total or fallback length', () => {
        useQuizzesMock.mockReturnValueOnce(
            makeQuery({ data: { totalElements: 42 } }),
        );
        useSearchQuizzesLocalizedMock.mockReturnValueOnce(makeQuery());
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        const out1 = useQuizzesCatalog({
            locale: 'en',
            page: 0,
            size: 10,
            filters: { search: '', category: 'all', duration: 'any' },
        });

        expect(out1.total).toBe(42);

        useQuizzesMock.mockReturnValueOnce(
            makeQuery({ data: { total: 7 } }),
        );
        useSearchQuizzesLocalizedMock.mockReturnValueOnce(makeQuery());
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        const out2 = useQuizzesCatalog({
            locale: 'en',
            page: 0,
            size: 10,
            filters: { search: '', category: 'all', duration: 'any' },
        });

        expect(out2.total).toBe(7);
    });

    test('isLoading and errors are propagated', () => {
        const e1 = new Error('q');
        const e2 = new Error('m');
        const e3 = new Error('c');

        useQuizzesMock.mockReturnValueOnce(makeQuery({ error: e1 }));
        useSearchQuizzesLocalizedMock.mockReturnValueOnce(makeQuery());
        useGetAllMetricsMock.mockReturnValueOnce(
            makeQuery({ isLoading: true, error: e2 }),
        );
        useCategoriesMock.mockReturnValueOnce(
            makeQuery({ error: e3 }),
        );

        const out = useQuizzesCatalog({
            locale: 'en',
            page: 0,
            size: 10,
            filters: { search: '', category: 'all', duration: 'any' },
        });

        expect(out.isLoading).toBe(true);
        expect(out.quizzesError).toBe(e1);
        expect(out.metricsError).toBe(e2);
        expect(out.categoriesError).toBe(e3);
    });

    test('refetch calls all refetch functions', () => {
        const q1 = makeQuery();
        const q2 = makeQuery();
        const q3 = makeQuery();
        const q4 = makeQuery();

        useQuizzesMock.mockReturnValueOnce(q1);
        useSearchQuizzesLocalizedMock.mockReturnValueOnce(q2);
        useGetAllMetricsMock.mockReturnValueOnce(q3);
        useCategoriesMock.mockReturnValueOnce(q4);

        const out = useQuizzesCatalog({
            locale: 'en',
            page: 0,
            size: 10,
            filters: { search: '', category: 'all', duration: 'any' },
        });

        out.refetch();

        expect(q1.refetch).toHaveBeenCalled();
        expect(q3.refetch).toHaveBeenCalled();
        expect(q4.refetch).toHaveBeenCalled();
    });

    test('passes expected options to useGetAllMetrics', () => {
        useQuizzesMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useSearchQuizzesLocalizedMock.mockReturnValueOnce(makeQuery());
        useGetAllMetricsMock.mockReturnValueOnce(makeQuery({ data: [] }));
        useCategoriesMock.mockReturnValueOnce(makeQuery({ data: [] }));

        useQuizzesCatalog({
            locale: 'en',
            page: 1,
            size: 20,
            filters: { search: '', category: 'all', duration: 'any' },
        });

        expect(useGetAllMetricsMock).toHaveBeenCalledWith({
            query: {
                staleTime: 60_000,
                gcTime: 5 * 60_000,
                refetchOnWindowFocus: false,
            },
        });
    });
});
