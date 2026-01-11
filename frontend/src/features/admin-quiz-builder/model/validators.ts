import type { ScaleDraft, QuestionDraft, ResultsDraft } from './store';

export type ValidationErrors = Record<string, string>;

export function validateInit(v: {
    title: string;
    code: string;
}): ValidationErrors {
    const e: ValidationErrors = {};
    if (!v.title.trim()) e.title = 'required';
    if (!v.code.trim()) e.code = 'required';
    if (v.code.trim().length < 3) e.code = 'min3';
    return e;
}

export function validateScales(scales: ScaleDraft[]): ValidationErrors {
    const e: ValidationErrors = {};
    if (scales.length < 1) e.scales = 'min1';
    for (const s of scales) {
        if (!s.name.trim()) e[`scale.${s.tempId}.name`] = 'required';
        if (!s.code.trim()) e[`scale.${s.tempId}.code`] = 'required';
    }
    return e;
}

export function validateQuestions(
    questions: QuestionDraft[],
    traitIds: number[],
): ValidationErrors {
    const e: ValidationErrors = {};
    if (questions.length < 1) e.questions = 'min1';

    for (const q of questions) {
        if (!q.text.trim()) e[`q.${q.tempId}.text`] = 'required';
        if (!q.qtype.trim()) e[`q.${q.tempId}.qtype`] = 'required';
        if (q.options.length < 2) e[`q.${q.tempId}.options`] = 'min2';

        for (const o of q.options) {
            if (!o.label.trim()) e[`o.${o.tempId}.label`] = 'required';
            const hasAnyMapping = o.traits.length > 0;
            if (!hasAnyMapping) e[`o.${o.tempId}.traits`] = 'map1';
            for (const m of o.traits) {
                if (!traitIds.includes(m.traitId)) e[`o.${o.tempId}.traits`] = 'invalid';
            }
        }
    }

    return e;
}

export function validateResults(v: ResultsDraft): ValidationErrors {
    const e: ValidationErrors = {};
    if (v.selectedCategoryIds.length < 1) e.categories = 'min1';
    if (v.selectedProfessionIds.length < 1) e.professions = 'min1';
    return e;
}
