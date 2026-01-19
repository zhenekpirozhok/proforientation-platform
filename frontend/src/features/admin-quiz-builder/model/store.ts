import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CreateQuestionRequestQtype } from '@/shared/api/generated/model/createQuestionRequestQtype';

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

    patchResults: (v: Partial<ResultsDraft>) => void;
    setResults: (v: ResultsDraft) => void;

    setScales: (v: ScaleDraft[]) => void;
    setQuestions: (v: QuestionDraft[]) => void;

    hydrateFromServerQuiz: (quiz: any) => void;

    reset: () => void;
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

function toNumber(v: unknown): number | undefined {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function toArray<T>(v: unknown): T[] {
    if (Array.isArray(v)) return v as T[];
    if (!v || typeof v !== 'object') return [];
    const o = v as any;
    if (Array.isArray(o.items)) return o.items as T[];
    if (Array.isArray(o.results)) return o.results as T[];
    if (Array.isArray(o.rows)) return o.rows as T[];
    if (Array.isArray(o.content)) return o.content as T[];
    if (o.data !== undefined) return toArray<T>(o.data);
    if (o.result !== undefined) return toArray<T>(o.result);
    if (o.payload !== undefined) return toArray<T>(o.payload);
    return [];
}

function safeIds(v: unknown): number[] {
    return Array.isArray(v) ? (v.filter((x) => typeof x === 'number' && Number.isFinite(x)) as number[]) : [];
}

function normalizeWeights(weights: unknown): Record<number, number> {
    if (!weights || typeof weights !== 'object') return {};
    const o = weights as Record<string, unknown>;
    const out: Record<number, number> = {};
    for (const [k, v] of Object.entries(o)) {
        const tid = Number(k);
        if (!Number.isFinite(tid)) continue;
        const val = typeof v === 'number' ? v : Number(v);
        out[tid] = Number.isFinite(val) ? val : 0;
    }
    return out;
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

            setScales: (v) => set({ scales: v }),

            setQuestions: (v) => set({ questions: v }),

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

                set({
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
                                weightsByTraitId: ensureWeights(
                                    o.weightsByTraitId,
                                    traitIds.filter((x) => allowSet.has(x)),
                                ),
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

            hydrateFromServerQuiz: (quiz) => {
                const q = quiz ?? {};

                const ctxQuizId = toNumber(q.id);
                const ctxVersion = toNumber(q.version);
                const ctxQuizVersionId = toNumber(q.quizVersionId);

                const initTitle = typeof q.title === 'string' ? q.title : '';
                const initCode = typeof q.code === 'string' ? q.code : '';
                const initDescription =
                    typeof (q.description ?? q.descriptionDefault) === 'string' ? (q.description ?? q.descriptionDefault) : '';

                const backendTraits = toArray<any>(q.traits ?? q.scales ?? q.quizTraits ?? []);
                const scaleDrafts: ScaleDraft[] = backendTraits
                    .flatMap((tr: any) => {
                        const polarity = (tr?.polarity ?? tr?.mode ?? tr?.type ?? 'single') as 'single' | 'bipolar';

                        if (polarity === 'bipolar') {
                            const pairId = String(tr?.pairId ?? tr?.pairCode ?? tr?.bipolarPairCode ?? id('pair'));
                            const pairCode = tr?.pairCode ?? tr?.bipolarPairCode ?? '';

                            const left = tr?.left ?? tr?.negative ?? tr?.a ?? {};
                            const right = tr?.right ?? tr?.positive ?? tr?.b ?? {};

                            const leftTraitId = toNumber(left?.id ?? left?.traitId ?? tr?.leftTraitId);
                            const rightTraitId = toNumber(right?.id ?? right?.traitId ?? tr?.rightTraitId);

                            return [
                                {
                                    tempId: id('scale'),
                                    traitId: leftTraitId,
                                    polarity: 'bipolar',
                                    side: 'LEFT',
                                    pairId,
                                    bipolarPairCode: pairCode,
                                    name: left?.name ?? left?.title ?? tr?.leftName ?? '',
                                    code: left?.code ?? tr?.leftCode ?? '',
                                    description: left?.description ?? tr?.leftDescription ?? '',
                                    codeTouched: true,
                                },
                                {
                                    tempId: id('scale'),
                                    traitId: rightTraitId,
                                    polarity: 'bipolar',
                                    side: 'RIGHT',
                                    pairId,
                                    bipolarPairCode: pairCode,
                                    name: right?.name ?? right?.title ?? tr?.rightName ?? '',
                                    code: right?.code ?? tr?.rightCode ?? '',
                                    description: right?.description ?? tr?.rightDescription ?? '',
                                    codeTouched: true,
                                },
                            ] as ScaleDraft[];
                        }

                        const tid = toNumber(tr?.id ?? tr?.traitId);
                        return [
                            {
                                tempId: id('scale'),
                                traitId: tid,
                                polarity: 'single',
                                name: tr?.name ?? tr?.title ?? '',
                                code: tr?.code ?? '',
                                description: tr?.description ?? '',
                                codeTouched: true,
                            } as ScaleDraft,
                        ];
                    })
                    .filter(Boolean);

                const detectedMode: ScaleMode =
                    scaleDrafts.some((s) => s.polarity === 'bipolar') ? 'bipolar' : scaleDrafts.length > 0 ? 'single' : get().scaleMode;

                const backendQuestions = toArray<any>(q.questions ?? q.items ?? q.quizQuestions ?? []);
                const questionDrafts: QuestionDraft[] = backendQuestions
                    .map((qq: any, idx: number) => {
                        const qtype = (qq?.qtype ?? qq?.type ?? CreateQuestionRequestQtype.SINGLE_CHOICE) as string;
                        const ord = toNumber(qq?.ord ?? qq?.order ?? qq?.position) ?? idx + 1;

                        const linkedTraitIds = safeIds(
                            qq?.linkedTraitIds ??
                            qq?.traitIds ??
                            qq?.traits ??
                            (Array.isArray(qq?.linkedTraits) ? qq.linkedTraits.map((x: any) => x?.id) : []),
                        );

                        const opts = toArray<any>(qq?.options ?? qq?.answers ?? qq?.variants ?? []);
                        const optionDrafts: OptionDraft[] = opts.map((o: any, oidx: number) => ({
                            tempId: id('opt'),
                            ord: toNumber(o?.ord ?? o?.order ?? o?.position) ?? oidx + 1,
                            label: o?.label ?? o?.text ?? o?.title ?? '',
                            optionId: toNumber(o?.id ?? o?.optionId),
                            weightsByTraitId: normalizeWeights(o?.weightsByTraitId ?? o?.weights ?? o?.traitWeights ?? {}),
                        }));

                        return {
                            tempId: id('q'),
                            ord,
                            qtype,
                            text: qq?.text ?? qq?.title ?? qq?.question ?? '',
                            linkedTraitIds,
                            questionId: toNumber(qq?.id ?? qq?.questionId),
                            options: optionDrafts.length > 0 ? optionDrafts : [{ tempId: id('opt'), ord: 1, label: '', weightsByTraitId: {} }],
                        };
                    })
                    .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));

                const backendResults = q.results ?? q.resultConfig ?? q.recommendations ?? q.outcome ?? {};
                const selectedCategoryIds = safeIds(
                    backendResults?.selectedCategoryIds ?? backendResults?.categoryIds ?? backendResults?.categories ?? q?.selectedCategoryIds ?? q?.categoryIds,
                );
                const selectedProfessionIds = safeIds(
                    backendResults?.selectedProfessionIds ??
                    backendResults?.professionIds ??
                    backendResults?.professions ??
                    q?.selectedProfessionIds ??
                    q?.professionIds,
                );

                set({
                    step: 0,
                    quizId: ctxQuizId ?? get().quizId,
                    version: ctxVersion ?? get().version,
                    quizVersionId: ctxQuizVersionId ?? get().quizVersionId,
                    init: { title: initTitle, code: initCode, description: initDescription, codeTouched: true },
                    scales: scaleDrafts,
                    scaleMode: detectedMode,
                    editingScaleTempId: undefined,
                    editingPairId: undefined,
                    questions: questionDrafts,
                    activeQuestionTempId: undefined,
                    results: { selectedCategoryIds, selectedProfessionIds },
                });
            },

            reset: () => set({ ...initialState, hydrated: get().hydrated }),
        }),
        {
            name: 'admin-quiz-builder',
            version: 8,
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
