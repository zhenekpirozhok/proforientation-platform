import { z } from 'zod';
import type { ScaleDraft, QuestionDraft, ResultsDraft } from './store';

export type ValidationErrors = Record<string, string>;

const initSchema = z.object({
    title: z.string().trim().min(1, { message: 'required' }),
    code: z.string().trim().min(1, { message: 'required' }).min(3, { message: 'min3' }),
    description: z.string().optional(),
});

const scalesSchema = z
    .array(
        z.object({
            tempId: z.string(),
            name: z.string().trim().min(1, { message: 'required' }),
            code: z.string().trim().min(1, { message: 'required' }),
        }),
    )
    .min(1, { message: 'min1' });

const questionsSchema = (traitIds: number[]) =>
    z
        .array(
            z.object({
                tempId: z.string(),
                qtype: z.string().trim().min(1, { message: 'required' }),
                text: z.string().trim().min(1, { message: 'required' }),
                options: z
                    .array(
                        z.object({
                            tempId: z.string(),
                            label: z.string().trim().min(1, { message: 'required' }),
                            traits: z
                                .array(
                                    z.object({
                                        traitId: z.number(),
                                        weight: z.number(),
                                    }),
                                )
                                .min(1, { message: 'map1' })
                                .superRefine((traits, ctx) => {
                                    const bad = traits.some((m) => !traitIds.includes(m.traitId));
                                    if (bad) {
                                        ctx.addIssue({
                                            code: z.ZodIssueCode.custom,
                                            message: 'invalid',
                                        });
                                    }
                                }),
                        }),
                    )
                    .min(2, { message: 'min2' }),
            }),
        )
        .min(1, { message: 'min1' });

const resultsSchema = z.object({
    selectedCategoryIds: z.array(z.number()).min(1, { message: 'min1' }),
    selectedProfessionIds: z.array(z.number()).min(1, { message: 'min1' }),
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
    const r = scalesSchema.safeParse(scales);
    if (r.success) return {};
    const out: ValidationErrors = {};
    for (const issue of r.error.issues) {
        if (issue.path.length === 0) {
            add(out, 'scales', issue.message || 'min1');
            continue;
        }
        const idx = Number(issue.path[0]);
        const field = String(issue.path[1] ?? '');
        const tempId = scales[idx]?.tempId;
        if (tempId && field) add(out, `scale.${tempId}.${field}`, issue.message || 'required');
    }
    return out;
}

export function validateQuestions(questions: QuestionDraft[], traitIds: number[]): ValidationErrors {
    const r = questionsSchema(traitIds).safeParse(questions);
    if (r.success) return {};
    const out: ValidationErrors = {};
    for (const issue of r.error.issues) {
        if (issue.path.length === 0) {
            add(out, 'questions', issue.message || 'min1');
            continue;
        }

        const qIdx = Number(issue.path[0]);
        const q = questions[qIdx];
        if (!q) continue;

        const second = String(issue.path[1] ?? '');

        if (second === 'text' || second === 'qtype' || second === 'options') {
            add(out, `q.${q.tempId}.${second}`, issue.message || 'required');
            continue;
        }

        if (second === 'options') {
            const oIdx = Number(issue.path[2]);
            const o = q.options[oIdx];
            if (!o) continue;

            const third = String(issue.path[3] ?? '');
            if (third === 'label' || third === 'traits') {
                add(out, `o.${o.tempId}.${third}`, issue.message || 'required');
            }
            continue;
        }
    }
    return out;
}

export function validateResults(v: ResultsDraft): ValidationErrors {
    const r = resultsSchema.safeParse(v);
    if (r.success) return {};
    const out: ValidationErrors = {};
    for (const issue of r.error.issues) {
        const field = String(issue.path[0] ?? '');
        if (field === 'selectedCategoryIds') add(out, 'categories', issue.message || 'min1');
        if (field === 'selectedProfessionIds') add(out, 'professions', issue.message || 'min1');
    }
    return out;
}
