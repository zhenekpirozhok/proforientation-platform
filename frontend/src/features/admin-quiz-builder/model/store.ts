import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BuilderStep = 0 | 1 | 2 | 3 | 4;
export type ScaleMode = 'single' | 'bipolar' | null;

export type ScaleDraft = {
    tempId: string;
    pairId?: string;
    side?: 'LEFT' | 'RIGHT';
    bipolarPairCode?: string;
    name: string;
    code: string;
    codeTouched: boolean;
    color?: string;
    polarity: 'single' | 'bipolar';
    description: string;
    traitId?: number;
};

export type OptionDraft = {
    tempId: string;
    label: string;
    ord: number;
    optionId?: number;
    weightsByTraitId: Record<number, number>;
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

    scaleMode: ScaleMode;
    editingScaleTempId?: string;
    editingPairId?: string;

    activeQuestionTempId?: string;

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

    setScaleMode: (m: ScaleMode) => void;
    startEditScale: (tempId: string) => void;
    startEditPair: (pairId: string) => void;
    stopEdit: () => void;

    addSingleScale: (v: {
        name: string;
        code: string;
        description: string;
        color?: string;
    }) => void;

    addBipolarPair: (v: {
        pairCode: string;
        left: { name: string; code: string; description: string; color?: string };
        right: { name: string; code: string; description: string; color?: string };
    }) => void;

    patchScale: (tempId: string, v: Partial<ScaleDraft>) => void;

    removeScale: (tempId: string) => void;
    removePair: (pairId: string) => void;

    setActiveQuestion: (tempId?: string) => void;

    addQuestion: (v: { ord: number; qtype: string; text: string }, traitIds: number[]) => void;
    patchQuestion: (tempId: string, v: Partial<Omit<QuestionDraft, 'tempId' | 'options'>>) => void;
    removeQuestion: (tempId: string) => void;

    addOption: (questionTempId: string, ord: number, traitIds: number[]) => void;
    patchOption: (questionTempId: string, optionTempId: string, v: Partial<Omit<OptionDraft, 'tempId'>>) => void;
    removeOption: (questionTempId: string, optionTempId: string) => void;

    syncOptionWeightsWithTraits: (traitIds: number[]) => void;

    reset: () => void;
};

function id(prefix: string) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function deriveScaleMode(scales: ScaleDraft[]): ScaleMode {
    if (scales.length === 0) return null;
    const p = scales[0]?.polarity;
    return p === 'single' || p === 'bipolar' ? p : null;
}

function cleanupEditState(scales: ScaleDraft[], editingScaleTempId?: string, editingPairId?: string) {
    let nextEditingScaleTempId = editingScaleTempId;
    let nextEditingPairId = editingPairId;

    if (nextEditingScaleTempId && !scales.some((s) => s.tempId === nextEditingScaleTempId)) {
        nextEditingScaleTempId = undefined;
    }

    if (nextEditingPairId && !scales.some((s) => s.pairId === nextEditingPairId)) {
        nextEditingPairId = undefined;
    }

    return { nextEditingScaleTempId, nextEditingPairId };
}

function buildWeights(traitIds: number[]) {
    const obj: Record<number, number> = {};
    for (const tid of traitIds) obj[tid] = 0;
    return obj;
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

    scaleMode: null as ScaleMode,
    editingScaleTempId: undefined as string | undefined,
    editingPairId: undefined as string | undefined,

    activeQuestionTempId: undefined as string | undefined,

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

            setScaleMode: (scaleMode) => {
                const hasScales = get().scales.length > 0;
                if (hasScales) return;
                set({ scaleMode });
            },

            startEditScale: (editingScaleTempId) =>
                set({ editingScaleTempId, editingPairId: undefined }),

            startEditPair: (editingPairId) =>
                set({ editingPairId, editingScaleTempId: undefined }),

            stopEdit: () => set({ editingScaleTempId: undefined, editingPairId: undefined }),

            addSingleScale: (v) => {
                const mode = get().scaleMode;
                if (mode && mode !== 'single') return;

                if (!mode) set({ scaleMode: 'single' });

                set({
                    scales: [
                        ...get().scales,
                        {
                            tempId: id('scale'),
                            polarity: 'single',
                            name: v.name,
                            code: v.code,
                            description: v.description,
                            color: v.color,
                            codeTouched: true,
                        },
                    ],
                });
            },

            addBipolarPair: ({ pairCode, left, right }) => {
                const mode = get().scaleMode;
                if (mode && mode !== 'bipolar') return;

                if (!mode) set({ scaleMode: 'bipolar' });

                const pairId = id('pair');

                set({
                    scales: [
                        ...get().scales,
                        {
                            tempId: id('scale'),
                            pairId,
                            side: 'LEFT',
                            bipolarPairCode: pairCode,
                            polarity: 'bipolar',
                            name: left.name,
                            code: left.code,
                            description: left.description,
                            color: left.color,
                            codeTouched: true,
                        },
                        {
                            tempId: id('scale'),
                            pairId,
                            side: 'RIGHT',
                            bipolarPairCode: pairCode,
                            polarity: 'bipolar',
                            name: right.name,
                            code: right.code,
                            description: right.description,
                            color: right.color,
                            codeTouched: true,
                        },
                    ],
                });
            },

            patchScale: (tempId, v) =>
                set({
                    scales: get().scales.map((s) => (s.tempId === tempId ? { ...s, ...v } : s)),
                }),

            removeScale: (tempId) => {
                const prev = get().scales;
                const next = prev.filter((s) => s.tempId !== tempId);

                const { nextEditingScaleTempId, nextEditingPairId } = cleanupEditState(
                    next,
                    get().editingScaleTempId,
                    get().editingPairId,
                );

                set({
                    scales: next,
                    scaleMode: deriveScaleMode(next),
                    editingScaleTempId: nextEditingScaleTempId,
                    editingPairId: nextEditingPairId,
                });
            },

            removePair: (pairId) => {
                const prev = get().scales;
                const next = prev.filter((s) => s.pairId !== pairId);

                const { nextEditingScaleTempId, nextEditingPairId } = cleanupEditState(
                    next,
                    get().editingScaleTempId,
                    get().editingPairId,
                );

                set({
                    scales: next,
                    scaleMode: deriveScaleMode(next),
                    editingScaleTempId: nextEditingScaleTempId,
                    editingPairId: nextEditingPairId,
                });
            },

            setActiveQuestion: (tempId) => set({ activeQuestionTempId: tempId }),

            addQuestion: (v, traitIds) => {
                const qTempId = id('q');
                const oTempId = id('opt');

                set({
                    activeQuestionTempId: qTempId,
                    questions: [
                        ...get().questions,
                        {
                            tempId: qTempId,
                            ord: v.ord,
                            qtype: v.qtype,
                            text: v.text,
                            options: [
                                {
                                    tempId: oTempId,
                                    ord: 1,
                                    label: '',
                                    weightsByTraitId: buildWeights(traitIds),
                                },
                            ],
                        },
                    ],
                });
            },

            patchQuestion: (tempId, v) =>
                set({
                    questions: get().questions.map((q) =>
                        q.tempId === tempId ? { ...q, ...v } : q,
                    ),
                }),

            removeQuestion: (tempId) => {
                const next = get().questions.filter((q) => q.tempId !== tempId);
                const active = get().activeQuestionTempId;
                const nextActive =
                    active === tempId ? next.at(-1)?.tempId : active;

                set({ questions: next, activeQuestionTempId: nextActive });
            },

            addOption: (questionTempId, ord, traitIds) =>
                set({
                    questions: get().questions.map((q) =>
                        q.tempId !== questionTempId
                            ? q
                            : {
                                ...q,
                                options: [
                                    ...q.options,
                                    {
                                        tempId: id('opt'),
                                        ord,
                                        label: '',
                                        weightsByTraitId: buildWeights(traitIds),
                                    },
                                ],
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

            syncOptionWeightsWithTraits: (traitIds) =>
                set({
                    questions: get().questions.map((q) => ({
                        ...q,
                        options: q.options.map((o) => {
                            const next = { ...o.weightsByTraitId };
                            for (const tid of traitIds) if (!(tid in next)) next[tid] = 0;
                            for (const key of Object.keys(next)) {
                                const n = Number(key);
                                if (!traitIds.includes(n)) delete next[n];
                            }
                            return { ...o, weightsByTraitId: next };
                        }),
                    })),
                }),

            reset: () => set({ ...initialState }),
        }),
        {
            name: 'admin-quiz-builder',
            version: 5,
            partialize: (s) => ({
                step: s.step,
                quizId: s.quizId,
                version: s.version,
                quizVersionId: s.quizVersionId,
                init: s.init,
                scaleMode: s.scaleMode,
                scales: s.scales,
                questions: s.questions,
                results: s.results,
                activeQuestionTempId: s.activeQuestionTempId,
            }),
            onRehydrateStorage: () => (state) => state?.setHydrated(true),
        },
    ),
);
