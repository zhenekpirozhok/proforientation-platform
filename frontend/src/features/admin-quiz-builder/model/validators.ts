import { z } from 'zod';
import type { ScaleDraft, QuestionDraft, ResultsDraft } from './store';

export type ValidationErrors = Record<string, string>;

const initSchema = z.object({
    title: z.string().trim().min(1, { message: 'required' }),
    code: z.string().trim().min(1, { message: 'required' }).min(3, { message: 'min3' }),
    description: z.string().optional(),
});

function add(out: ValidationErrors, key: string, code: string) {
    if (!out[key]) out[key] = code;
}

export function validateInit(v: { title: string; code: string; description?: string }): ValidationErrors {
    const r = initSchema.safeParse(v);
    if (r.success) return {};
    const out: ValidationErrors = {};
    for (const issue of r.error.issues) {
        const field = String(issue.path[0] ?? '');
        if (field) add(out, field, issue.message || 'required');
    }
    return out;
}

export function validateScales(scales: ScaleDraft[]): ValidationErrors {
    const out: ValidationErrors = {};
    if (scales.length < 1) add(out, 'scales', 'min1');

    const hasSingle = scales.some((s) => s.polarity === 'single');
    const hasBipolar = scales.some((s) => s.polarity === 'bipolar');
    if (hasSingle && hasBipolar) add(out, 'scales', 'mixedPolarity');

    for (const s of scales) {
        if (!s.name.trim()) add(out, `scale.${s.tempId}.name`, 'required');
        if (!s.code.trim()) add(out, `scale.${s.tempId}.code`, 'required');
        if (!s.description.trim()) add(out, `scale.${s.tempId}.description`, 'required');
    }

    const bipolar = scales.filter((s) => s.polarity === 'bipolar');
    if (bipolar.length > 0) {
        const groups = new Map<string, ScaleDraft[]>();
        for (const s of bipolar) {
            if (!s.pairId) continue;
            groups.set(s.pairId, [...(groups.get(s.pairId) ?? []), s]);
        }

        for (const [pairId, arr] of groups.entries()) {
            if (arr.length !== 2) add(out, `pair.${pairId}`, 'pairIncomplete');

            const hasLeft = arr.some((x) => x.side === 'LEFT');
            const hasRight = arr.some((x) => x.side === 'RIGHT');
            if (!hasLeft || !hasRight) add(out, `pair.${pairId}`, 'pairRequired');

            const codes = new Set(arr.map((x) => (x.bipolarPairCode ?? '').trim()).filter(Boolean));
            if (codes.size === 0) add(out, `pair.${pairId}`, 'pairCodeRequired');
            if (codes.size > 1) add(out, `pair.${pairId}`, 'pairCodeMismatch');
        }
    }

    return out;
}

export function validateQuestions(questions: QuestionDraft[], traitIds: number[]): ValidationErrors {
    const out: ValidationErrors = {};
    if (questions.length < 1) add(out, 'questions', 'min1');

    for (const q of questions) {
        if (!q.text.trim()) add(out, `q.${q.tempId}.text`, 'required');
        if (!q.qtype.trim()) add(out, `q.${q.tempId}.qtype`, 'required');
        if (q.options.length < 2) add(out, `q.${q.tempId}.options`, 'min2');

        for (const o of q.options) {
            if (!o.label.trim()) add(out, `o.${o.tempId}.label`, 'required');

            if (traitIds.length > 0) {
                const map = o.weightsByTraitId ?? {};
                for (const tid of traitIds) {
                    if (!(tid in map)) add(out, `o.${o.tempId}.weights`, 'weightsMissing');
                }
            }
        }
    }

    return out;
}

export function validateResults(v: ResultsDraft): ValidationErrors {
    const out: ValidationErrors = {};
    if (v.selectedCategoryIds.length < 1) add(out, 'categories', 'min1');
    if (v.selectedProfessionIds.length < 1) add(out, 'professions', 'min1');
    return out;
}
