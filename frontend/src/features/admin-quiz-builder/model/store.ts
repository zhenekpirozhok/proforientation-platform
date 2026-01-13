import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BuilderStep = 0 | 1 | 2 | 3 | 4;
export type ScaleMode = 'single' | 'bipolar' | null;

export type ScaleDraft = {
    tempId: string;
    name: string;
    code: string;
    description: string;
    polarity: 'single' | 'bipolar';
    side?: 'LEFT' | 'RIGHT';
    pairId?: string;
    bipolarPairCode?: string;
    traitId?: number;
    codeTouched?: boolean;
};

export type OptionDraft = {
    tempId: string;
    ord: number;
    label: string;
    optionId?: number;
    weightsByTraitId: Record<number, number>;
};

export type QuestionDraft = {
    tempId: string;
    ord: number;
    qtype: string;
    text: string;
    linkedTraitIds: number[];
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
        description: string;
        codeTouched?: boolean;
    };

    scales: ScaleDraft[];
    scaleMode: ScaleMode;
    editingScaleTempId?: string;
    editingPairId?: string;

    questions: QuestionDraft[];
    activeQuestionTempId?: string;

    results: ResultsDraft;

    setHydrated: (v: boolean) => void;

    setStep: (s: BuilderStep) => void;

    setQuizContext: (v: { quizId: number; version: number; quizVersionId?: number }) => void;

    patchInit: (v: Partial<BuilderState['init']>) => void;

    setActiveQuestion: (tempId?: string) => void;

    setScaleMode: (mode: ScaleMode) => void;
    startEditScale: (tempId: string) => void;
    startEditPair: (pairId: string) => void;
    stopEdit: () => void;

    addScale: (v: Omit<ScaleDraft, 'tempId'>) => void;
    addSingleScale: (v: Omit<Omit<ScaleDraft, 'tempId'>, 'polarity' | 'side' | 'pairId'>) => void;
    addBipolarPair: (v: {
        pairCode: string;
        left: Omit<Omit<Omit<ScaleDraft, 'tempId'>, 'polarity'>, 'side' | 'pairId'>;
        right: Omit<Omit<Omit<ScaleDraft, 'tempId'>, 'polarity'>, 'side' | 'pairId'>;
    }) => void;
    patchScale: (tempId: string, v: Partial<ScaleDraft>) => void;
    removeScale: (tempId: string) => void;
    removePair: (pairId: string) => void;

    addQuestion: (v: Omit<QuestionDraft, 'tempId' | 'options'>, traitIds: number[]) => void;
    patchQuestion: (tempId: string, v: Partial<Omit<QuestionDraft, 'tempId' | 'options'>>) => void;
    removeQuestion: (tempId: string) => void;

    addOption: (questionTempId: string, ord: number, traitIds: number[]) => void;
    patchOption: (questionTempId: string, optionTempId: string, v: Partial<OptionDraft>) => void;
    removeOption: (questionTempId: string, optionTempId: string) => void;

    syncOptionWeightsWithTraits: (traitIds: number[]) => void;

    applyLinkedTraitsToQuestion: (questionTempId: string, linkedTraitIds: number[]) => void;

    reorderQuestions: (activeId: string, overId: string) => void;
    reorderOptions: (questionTempId: string, activeId: string, overId: string) => void;

    reset: () => void;
    patchResults: (v: Partial<ResultsDraft>) => void;
    setResults: (v: ResultsDraft) => void;
};

function id(prefix: string) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function buildWeights(traitIds: number[]) {
    const out: Record<number, number> = {};
    for (const tid of traitIds) out[tid] = 0;
    return out;
}

function ensureWeights(current: Record<number, number>, traitIds: number[]) {
    const next = { ...(current ?? {}) };
    for (const tid of traitIds) if (!(tid in next)) next[tid] = 0;
    for (const k of Object.keys(next)) {
        const n = Number(k);
        if (!traitIds.includes(n)) delete next[n];
    }
    return next;
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
    },

    scales: [] as ScaleDraft[],
    scaleMode: 'single' as ScaleMode,
    editingScaleTempId: undefined as string | undefined,
    editingPairId: undefined as string | undefined,

    questions: [] as QuestionDraft[],
    activeQuestionTempId: undefined as string | undefined,

    results: {
        selectedCategoryIds: [] as number[],
        selectedProfessionIds: [] as number[],
    } as ResultsDraft,
};

export const useAdminQuizBuilderStore = create<BuilderState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setHydrated: (v) => set({ hydrated: v }),

            setStep: (step) => set({ step }),

            setQuizContext: ({ quizId, version, quizVersionId }) => set({ quizId, version, quizVersionId }),

            patchInit: (v) => set({ init: { ...get().init, ...v } }),

            patchResults: (v) => set({ results: { ...get().results, ...v } }),

            setResults: (v) => set({ results: v }),

            setActiveQuestion: (tempId) => set({ activeQuestionTempId: tempId }),

            setScaleMode: (mode) => set({ scaleMode: mode }),

            startEditScale: (tempId) => set({ editingScaleTempId: tempId }),

            startEditPair: (pairId) => set({ editingPairId: pairId }),

            stopEdit: () => set({ editingScaleTempId: undefined, editingPairId: undefined }),

            addScale: (v) => set({ scales: [...get().scales, { ...v, tempId: id('scale') }] }),

            addSingleScale: (v) =>
                set({
                    scales: [...get().scales, { ...v, tempId: id('scale'), polarity: 'single' as const }],
                }),

            addBipolarPair: (v) => {
                const pairId = id('pair');
                const leftTempId = id('scale');
                const rightTempId = id('scale');
                return set({
                    scales: [
                        ...get().scales,
                        {
                            ...v.left,
                            tempId: leftTempId,
                            polarity: 'bipolar' as const,
                            side: 'LEFT' as const,
                            pairId,
                            bipolarPairCode: v.pairCode,
                        },
                        {
                            ...v.right,
                            tempId: rightTempId,
                            polarity: 'bipolar' as const,
                            side: 'RIGHT' as const,
                            pairId,
                            bipolarPairCode: v.pairCode,
                        },
                    ],
                });
            },

            patchScale: (tempId, v) =>
                set({
                    scales: get().scales.map((s) => (s.tempId === tempId ? { ...s, ...v } : s)),
                }),

            removeScale: (tempId) =>
                set({
                    scales: get().scales.filter((s) => s.tempId !== tempId),
                    editingScaleTempId: get().editingScaleTempId === tempId ? undefined : get().editingScaleTempId,
                }),

            removePair: (pairId) =>
                set({
                    scales: get().scales.filter((s) => s.pairId !== pairId),
                    editingPairId: get().editingPairId === pairId ? undefined : get().editingPairId,
                }),

            addQuestion: (v, traitIds) => {
                const qTempId = id('q');
                const optTempId = id('opt');

                const q: QuestionDraft = {
                    ...v,
                    tempId: qTempId,
                    linkedTraitIds: (v as any).linkedTraitIds ?? [],
                    options: [
                        {
                            tempId: optTempId,
                            ord: 1,
                            label: '',
                            weightsByTraitId: buildWeights(traitIds),
                        },
                    ],
                };

                set({
                    questions: [...get().questions, q],
                    activeQuestionTempId: qTempId,
                });
            },

            patchQuestion: (tempId, v) =>
                set({
                    questions: get().questions.map((q) => (q.tempId === tempId ? { ...q, ...v } : q)),
                }),

            removeQuestion: (tempId) => {
                const next = get().questions.filter((q) => q.tempId !== tempId);
                const active = get().activeQuestionTempId;
                set({
                    questions: next,
                    activeQuestionTempId: active === tempId ? undefined : active,
                });
            },

            addOption: (questionTempId, ord, traitIds) =>
                set({
                    questions: get().questions.map((q) => {
                        if (q.tempId !== questionTempId) return q;
                        const allowed = q.linkedTraitIds ?? [];
                        const weights = buildWeights(traitIds.filter((x) => allowed.includes(x)));
                        return {
                            ...q,
                            options: [...q.options, { tempId: id('opt'), ord, label: '', weightsByTraitId: weights }],
                        };
                    }),
                }),

            patchOption: (questionTempId, optionTempId, v) =>
                set({
                    questions: get().questions.map((q) =>
                        q.tempId !== questionTempId
                            ? q
                            : {
                                ...q,
                                options: q.options.map((o) => (o.tempId === optionTempId ? { ...o, ...v } : o)),
                            },
                    ),
                }),

            removeOption: (questionTempId, optionTempId) =>
                set({
                    questions: get().questions.map((q) => {
                        if (q.tempId !== questionTempId) return q;
                        const nextOpts = q.options.filter((o) => o.tempId !== optionTempId);
                        const reOrd = nextOpts.map((o, idx) => ({ ...o, ord: idx + 1 }));
                        return { ...q, options: reOrd };
                    }),
                }),

            syncOptionWeightsWithTraits: (traitIds) =>
                set({
                    questions: get().questions.map((q) => {
                        const allowed = q.linkedTraitIds ?? [];
                        const allowSet = new Set<number>(allowed);
                        return {
                            ...q,
                            options: q.options.map((o) => ({
                                ...o,
                                weightsByTraitId: ensureWeights(o.weightsByTraitId, traitIds.filter((x) => allowSet.has(x))),
                            })),
                        };
                    }),
                }),

            applyLinkedTraitsToQuestion: (questionTempId, linkedTraitIds) =>
                set({
                    questions: get().questions.map((q) => {
                        if (q.tempId !== questionTempId) return q;
                        const allowSet = new Set<number>(linkedTraitIds);
                        return {
                            ...q,
                            linkedTraitIds,
                            options: q.options.map((o) => ({
                                ...o,
                                weightsByTraitId: ensureWeights(o.weightsByTraitId, Array.from(allowSet.values())),
                            })),
                        };
                    }),
                }),

            reorderQuestions: (activeId, overId) => {
                const arr = [...get().questions];
                const from = arr.findIndex((x) => x.tempId === activeId);
                const to = arr.findIndex((x) => x.tempId === overId);
                if (from === -1 || to === -1 || from === to) return;

                const [moved] = arr.splice(from, 1);
                arr.splice(to, 0, moved);

                const next = arr.map((q, idx) => ({ ...q, ord: idx + 1 }));

                set({ questions: next });
            },

            reorderOptions: (questionTempId, activeId, overId) => {
                const qs = get().questions.map((q) => {
                    if (q.tempId !== questionTempId) return q;

                    const opts = [...q.options];
                    const from = opts.findIndex((x) => x.tempId === activeId);
                    const to = opts.findIndex((x) => x.tempId === overId);
                    if (from === -1 || to === -1 || from === to) return q;

                    const [moved] = opts.splice(from, 1);
                    opts.splice(to, 0, moved);

                    const nextOpts = opts.map((o, idx) => ({ ...o, ord: idx + 1 }));
                    return { ...q, options: nextOpts };
                });

                set({ questions: qs });
            },

            reset: () => set({ ...initialState }),
        }),
        {
            name: 'admin-quiz-builder',
            version: 6,
            partialize: (s) => ({
                step: s.step,
                quizId: s.quizId,
                version: s.version,
                quizVersionId: s.quizVersionId,
                init: s.init,
                scales: s.scales,
                scaleMode: s.scaleMode,
                questions: s.questions,
                activeQuestionTempId: s.activeQuestionTempId,
                results: s.results,
            }),
            onRehydrateStorage: () => (state) => state?.setHydrated(true),
        },
    ),
);
