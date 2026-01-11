import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BuilderStep = 0 | 1 | 2 | 3 | 4;

export type ScaleDraft = {
    tempId: string;
    name: string;
    code: string;
    color?: string;
    polarity: 'single' | 'bipolar';
    description?: string;
    traitId?: number;
};

export type OptionDraft = {
    tempId: string;
    label: string;
    ord: number;
    optionId?: number;
    traits: Array<{ traitId: number; weight: number }>;
};

export type QuestionDraft = {
    tempId: string;
    ord: number;
    qtype: string;
    text: string;
    questionId?: number;
    options: OptionDraft[];
};

export type ResultsDraft = {
    selectedCategoryIds: number[];
    selectedProfessionIds: number[];
};

type BuilderState = {
    hydrated: boolean;

    step: BuilderStep;

    quizId?: number;
    version?: number;
    quizVersionId?: number;

    init: {
        title: string;
        code: string;
        description?: string;
        codeTouched: boolean;
    };

    scales: ScaleDraft[];
    questions: QuestionDraft[];
    results: ResultsDraft;

    setHydrated: (v: boolean) => void;

    setStep: (s: BuilderStep) => void;

    setQuizContext: (v: {
        quizId: number;
        version: number;
        quizVersionId?: number;
    }) => void;

    patchInit: (v: Partial<BuilderState['init']>) => void;

    addScale: (v: Omit<ScaleDraft, 'tempId'>) => void;
    patchScale: (tempId: string, v: Partial<ScaleDraft>) => void;
    removeScale: (tempId: string) => void;

    addQuestion: (v: Omit<QuestionDraft, 'tempId'>) => void;
    patchQuestion: (tempId: string, v: Partial<QuestionDraft>) => void;
    removeQuestion: (tempId: string) => void;

    addOption: (questionTempId: string, v: Omit<OptionDraft, 'tempId'>) => void;
    patchOption: (
        questionTempId: string,
        optionTempId: string,
        v: Partial<OptionDraft>,
    ) => void;
    removeOption: (questionTempId: string, optionTempId: string) => void;

    reset: () => void;
};

function id(prefix: string) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const initialState = {
    hydrated: false as const,
    step: 0 as BuilderStep,
    quizId: undefined as number | undefined,
    version: undefined as number | undefined,
    quizVersionId: undefined as number | undefined,
    init: {
        title: '',
        code: '',
        description: '',
        codeTouched: false,
    },
    scales: [] as ScaleDraft[],
    questions: [] as QuestionDraft[],
    results: {
        selectedCategoryIds: [],
        selectedProfessionIds: [],
    } as ResultsDraft,
};

export const useAdminQuizBuilderStore = create<BuilderState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setHydrated: (v) => set({ hydrated: v }),

            setStep: (step) => set({ step }),

            setQuizContext: ({ quizId, version, quizVersionId }) =>
                set({ quizId, version, quizVersionId }),

            patchInit: (v) => set({ init: { ...get().init, ...v } }),

            addScale: (v) =>
                set({
                    scales: [...get().scales, { ...v, tempId: id('scale') }],
                }),

            patchScale: (tempId, v) =>
                set({
                    scales: get().scales.map((s) =>
                        s.tempId === tempId ? { ...s, ...v } : s,
                    ),
                }),

            removeScale: (tempId) =>
                set({ scales: get().scales.filter((s) => s.tempId !== tempId) }),

            addQuestion: (v) =>
                set({
                    questions: [...get().questions, { ...v, tempId: id('q') }],
                }),

            patchQuestion: (tempId, v) =>
                set({
                    questions: get().questions.map((q) =>
                        q.tempId === tempId ? { ...q, ...v } : q,
                    ),
                }),

            removeQuestion: (tempId) =>
                set({ questions: get().questions.filter((q) => q.tempId !== tempId) }),

            addOption: (questionTempId, v) =>
                set({
                    questions: get().questions.map((q) =>
                        q.tempId !== questionTempId
                            ? q
                            : {
                                ...q,
                                options: [...q.options, { ...v, tempId: id('opt') }],
                            },
                    ),
                }),

            patchOption: (questionTempId, optionTempId, v) =>
                set({
                    questions: get().questions.map((q) =>
                        q.tempId !== questionTempId
                            ? q
                            : {
                                ...q,
                                options: q.options.map((o) =>
                                    o.tempId === optionTempId ? { ...o, ...v } : o,
                                ),
                            },
                    ),
                }),

            removeOption: (questionTempId, optionTempId) =>
                set({
                    questions: get().questions.map((q) =>
                        q.tempId !== questionTempId
                            ? q
                            : {
                                ...q,
                                options: q.options.filter((o) => o.tempId !== optionTempId),
                            },
                    ),
                }),

            reset: () => set({ ...initialState }),
        }),
        {
            name: 'admin-quiz-builder',
            version: 2,
            partialize: (s) => ({
                step: s.step,
                quizId: s.quizId,
                version: s.version,
                quizVersionId: s.quizVersionId,
                init: s.init,
                scales: s.scales,
                questions: s.questions,
                results: s.results,
            }),
            onRehydrateStorage: () => (state) => state?.setHydrated(true),
        },
    ),
);
