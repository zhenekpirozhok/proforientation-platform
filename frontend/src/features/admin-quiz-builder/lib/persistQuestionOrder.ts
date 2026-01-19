type Q = { questionId?: number; ord: number };

function toId(v: unknown): number | null {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
}

export async function persistQuestionOrderMove(params: {
    questions: Q[];
    fromIndex: number;
    toIndex: number;
    updateOrder: (id: number, ord: number) => Promise<any>;
}) {
    const { questions, fromIndex, toIndex, updateOrder } = params;

    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= questions.length || toIndex >= questions.length) return;

    const maxOrd = Math.max(0, ...questions.map((q) => (Number.isFinite(q.ord) ? q.ord : 0)));
    const moved = questions[fromIndex];
    const movedId = toId(moved?.questionId);
    if (!movedId) return;

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);

    for (let i = start; i <= end; i++) {
        if (!toId(questions[i]?.questionId)) return;
    }

    const tempOrd = maxOrd + 1;
    await updateOrder(movedId, tempOrd);

    if (fromIndex < toIndex) {
        for (let i = fromIndex + 1; i <= toIndex; i++) {
            const id = toId(questions[i].questionId)!;
            await updateOrder(id, i);
        }
    } else {
        for (let i = fromIndex - 1; i >= toIndex; i--) {
            const id = toId(questions[i].questionId)!;
            await updateOrder(id, i + 2);
        }
    }

    await updateOrder(movedId, toIndex + 1);
}
