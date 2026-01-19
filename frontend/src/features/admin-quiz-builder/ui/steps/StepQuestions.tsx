'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, JSX, ReactNode } from 'react';
import { Button, Card, Input, Select, Typography, InputNumber, message, Modal } from 'antd';
import { useTranslations, useLocale } from 'next-intl';

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { SectionCard } from '../SectionCard';
import { FieldError } from '../FieldError';
import { useAdminQuizBuilderStore } from '../../model/store';
import { CreateQuestionRequestQtype } from '@/shared/api/generated/model/createQuestionRequestQtype';

import { useStepValidation } from '../../lib/validation/useStepValidation';
import { StepValidationSummary } from '../../lib/validation/StepValidationSummary';
import { parseOptionKey, parseQuestionKey } from '../../lib/validation/validationKeys';
import { useQuizBuilderActions } from '@/features/admin-quiz-builder/api/useQuizBuilderActions';
import { persistQuestionOrderMove } from '@/features/admin-quiz-builder/lib/persistQuestionOrder';

type DraftOption = {
  tempId: string;
  label: string;
  weightsByTraitId: Record<number, number>;
};

type DraftQuestion = {
  text: string;
  qtype: string;
  linkedTraitIds: number[];
  options: DraftOption[];
};

interface Trait {
  traitId: number;
  name: string;
}

interface ErrorPair {
  key: string;
  code: string;
}

interface StepQuestionsProps {
  errors: Record<string, string>;
  submitAttempted?: boolean;
}

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function buildWeights(traitIds: number[]): Record<number, number> {
  const obj: Record<number, number> = {};
  for (const tid of traitIds) obj[tid] = 0;
  return obj;
}

function ensureWeights(current: Record<number, number> | undefined, traitIds: number[]): Record<number, number> {
  const next = { ...(current ?? {}) } as Record<number, number>;
  for (const tid of traitIds) if (!(tid in next)) next[tid] = 0;
  for (const k of Object.keys(next)) {
    const n = Number(k);
    if (!traitIds.includes(n)) delete next[n];
  }
  return next;
}

function toId(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function DragHandle(): JSX.Element {
  return (
    <div className="mr-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:h-10 sm:w-10">
      <span className="select-none text-lg leading-none">⋮⋮</span>
    </div>
  );
}

interface SortableQuestionCardProps {
  id: string;
  active: boolean;
  title: string;
  typeLabel: string;
  optionsPreview: string[];
  influenceLines?: string[];
  onEdit: () => void;
  onRemove: () => void;
  errors: ErrorPair[];
  removeLabel: string;
  editLabel: string;
}

function SortableQuestionCard(props: SortableQuestionCardProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`!rounded-2xl ${props.active ? 'border-indigo-300 dark:border-indigo-700' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start">
            <div {...attributes} {...listeners}>
              <DragHandle />
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{props.title}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{props.typeLabel}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={props.onEdit}>{props.editLabel}</Button>
            <Button danger onClick={props.onRemove}>
              {props.removeLabel}
            </Button>
          </div>
        </div>

        <div className="pt-3 text-sm text-slate-600 dark:text-slate-300 pb-1">
          {props.optionsPreview.map((x, idx) => (
            <div key={idx} className="truncate">
              • {x}
            </div>
          ))}
        </div>

        {props.influenceLines && props.influenceLines.length > 0 ? (
          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
            {props.influenceLines.map((ln, idx) => (
              <div key={idx} className="truncate">
                {ln}
              </div>
            ))}
          </div>
        ) : null}

        {props.errors.length > 0 ? (
          <div className="flex flex-col gap-1 pt-3">
            {props.errors.map((er) => (
              <div key={er.key} data-field={er.key}>
                <FieldError code={er.code} />
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

interface SortableOptionRowProps {
  id: string;
  label: string;
  placeholder: string;
  disableRemove: boolean;
  onChange: (v: string) => void;
  onRemove: () => void;
  error?: string;
  renderWeights: () => ReactNode;
  removeLabel: string;
}

function SortableOptionRow(props: SortableOptionRowProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card size="small" className="!rounded-2xl">
        <div className="flex items-start gap-3">
          <div {...attributes} {...listeners} className="pt-1">
            <DragHandle />
          </div>

          <div className="flex-1">
            <Input value={props.label} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} />
            {props.error ? <FieldError code={props.error} /> : null}
          </div>

          <Button danger onClick={props.onRemove} disabled={props.disableRemove}>
            {props.removeLabel}
          </Button>
        </div>

        {props.renderWeights()}
      </Card>
    </div>
  );
}

export function StepQuestions({ errors, submitAttempted }: StepQuestionsProps): JSX.Element {
  const t = useTranslations('AdminQuizBuilder.questions');
  const localeRaw = useLocale();
  const locale = (localeRaw?.toString().startsWith('ru') ? 'ru' : 'en') as 'ru' | 'en';

  const v = useStepValidation({ errors, submitAttempted });

  const scales = useAdminQuizBuilderStore((s) => s.scales);
  const questions = useAdminQuizBuilderStore((s) => s.questions);

  const addQuestion = useAdminQuizBuilderStore((s) => s.addQuestion);
  const patchQuestion = useAdminQuizBuilderStore((s) => s.patchQuestion);
  const removeQuestion = useAdminQuizBuilderStore((s) => s.removeQuestion);

  const applyLinkedTraitsToQuestion = useAdminQuizBuilderStore((s) => s.applyLinkedTraitsToQuestion);

  const addOption = useAdminQuizBuilderStore((s) => s.addOption);
  const patchOption = useAdminQuizBuilderStore((s) => s.patchOption);
  const removeOption = useAdminQuizBuilderStore((s) => s.removeOption);

  const syncOptionWeightsWithTraits = useAdminQuizBuilderStore((s) => s.syncOptionWeightsWithTraits);

  const reorderQuestions = useAdminQuizBuilderStore((s) => s.reorderQuestions);

  const storeQuizId = useAdminQuizBuilderStore((s) => s.quizId);
  const storeQuizVersionId = useAdminQuizBuilderStore((s) => s.quizVersionId);
  const actions = useQuizBuilderActions(storeQuizId ?? 0, storeQuizVersionId ?? 0);

  const availableTraits: Trait[] = useMemo(
    () =>
      scales
        .filter((s) => typeof s.traitId === 'number')
        .map((s) => ({ traitId: s.traitId as number, name: s.name })),
    [scales],
  );

  const allTraitIds: number[] = useMemo(() => availableTraits.map((x) => x.traitId), [availableTraits]);

  useEffect(() => {
    syncOptionWeightsWithTraits(allTraitIds);
  }, [allTraitIds.join('|')]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const likertLabels = useMemo(
    () =>
      locale === 'ru'
        ? ['Нет', 'Скорее нет', 'Нейтрально', 'Скорее да', 'Да']
        : ['No', 'Rather no', 'Neutral', 'Rather yes', 'Yes'],
    [locale],
  );

  const [draft, setDraft] = useState<DraftQuestion>(() => ({
    text: '',
    qtype: CreateQuestionRequestQtype.SINGLE_CHOICE,
    linkedTraitIds: [],
    options: [{ tempId: id('dopt'), label: '', weightsByTraitId: {} }],
  }));

  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const [editingTempId, setEditingTempId] = useState<string | null>(null);

  const reorderInFlightRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    setDraft((d) => ({
      ...d,
      options: d.options.map((o) => ({
        ...o,
        weightsByTraitId: ensureWeights(o.weightsByTraitId, d.linkedTraitIds),
      })),
    }));
  }, [draft.linkedTraitIds.join('|')]);

  function resetDraft() {
    setDraft({
      text: '',
      qtype: CreateQuestionRequestQtype.SINGLE_CHOICE,
      linkedTraitIds: [],
      options: [{ tempId: id('dopt'), label: '', weightsByTraitId: {} }],
    });
    setDraftErrors({});
    setEditingTempId(null);
  }

  function validateDraft() {
    const e: Record<string, string> = {};
    if (!draft.text.trim()) e.draftText = 'required';
    if (!draft.qtype.trim()) e.draftType = 'required';
    if (draft.linkedTraitIds.length < 1) e.draftTraits = 'min1';
    if (draft.linkedTraitIds.length > 2) e.draftTraits = 'max2';
    if (draft.options.length < 2) e.draftOptions = 'min2';
    for (const o of draft.options) if (!o.label.trim()) e[`draftOpt.${o.tempId}.label`] = 'required';
    return e;
  }

  function addDraftOption() {
    setDraft((d) => ({
      ...d,
      options: [...d.options, { tempId: id('dopt'), label: '', weightsByTraitId: buildWeights(d.linkedTraitIds) }],
    }));
  }

  function removeDraftOption(optTempId: string) {
    setDraft((d) => ({ ...d, options: d.options.filter((o) => o.tempId !== optTempId) }));
  }

  function patchDraftOption(optTempId: string, vv: Partial<DraftOption>) {
    setDraft((d) => ({
      ...d,
      options: d.options.map((o) => (o.tempId === optTempId ? { ...o, ...vv } : o)),
    }));
  }

  function onDraftTypeChange(vv: string) {
    setDraft((d) => {
      if (vv === CreateQuestionRequestQtype.LIKER_SCALE_5) {
        const opts = likertLabels.map((label) => ({
          tempId: id('dopt'),
          label,
          weightsByTraitId: buildWeights(d.linkedTraitIds),
        }));
        return { ...d, qtype: vv, options: opts };
      }

      const hasAny = d.options.length > 0;
      const nextOptions = hasAny
        ? d.options.map((o) => ({ ...o, weightsByTraitId: ensureWeights(o.weightsByTraitId, d.linkedTraitIds) }))
        : [{ tempId: id('dopt'), label: '', weightsByTraitId: buildWeights(d.linkedTraitIds) }];

      return { ...d, qtype: vv, options: nextOptions };
    });
  }

  function onDraftTraitsChange(next: number[]) {
    const trimmed = next.slice(0, 2);
    setDraft((d) => ({
      ...d,
      linkedTraitIds: trimmed,
      options: d.options.map((o) => ({ ...o, weightsByTraitId: ensureWeights(o.weightsByTraitId, trimmed) })),
    }));
  }

  function getQuestionErrorPairs(qTempId: string) {
    const pairs: Array<{ key: string; code: string }> = [];
    const a = errors[`q.${qTempId}.text`];
    const b = errors[`q.${qTempId}.qtype`];
    const c = errors[`q.${qTempId}.options`];
    const d = errors[`q.${qTempId}.traits`];
    if (a) pairs.push({ key: `q.${qTempId}.text`, code: a });
    if (b) pairs.push({ key: `q.${qTempId}.qtype`, code: b });
    if (c) pairs.push({ key: `q.${qTempId}.options`, code: c });
    if (d) pairs.push({ key: `q.${qTempId}.traits`, code: d });
    return pairs;
  }

  function renderWeightsBlock(
    linkedTraits: { traitId: number; name: string }[],
    weights: Record<number, number>,
    onChange: (next: Record<number, number>) => void,
  ) {
    if (linkedTraits.length === 0) {
      return (
        <div className="mt-3">
          <Typography.Text type="secondary">{t('selectTraitsHint')}</Typography.Text>
        </div>
      );
    }

    return (
      <div className="mt-4">
        <Typography.Text type="secondary" className="block">
          {t('weightsTitle')}
        </Typography.Text>

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {linkedTraits.map((tr) => (
            <div
              key={tr.traitId}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800"
            >
              <div className="min-w-0 truncate text-sm">{tr.name}</div>
              <InputNumber
                value={weights?.[tr.traitId] ?? 0}
                onChange={(vv) => {
                  const next = { ...(weights ?? {}) };
                  next[tr.traitId] = typeof vv === 'number' ? vv : 0;
                  onChange(next);
                }}
                step={0.25}
                className="w-28"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const draftLinkedTraits: Trait[] = useMemo(
    () => availableTraits.filter((x) => draft.linkedTraitIds.includes(x.traitId)),
    [availableTraits, draft.linkedTraitIds.join('|')],
  );

  function startEditQuestion(qTempId: string): void {
    const q = questions.find((x) => x.tempId === qTempId);
    if (!q) return;

    const linkedTraitIds = (q.linkedTraitIds ?? []).slice(0, 2);

    setEditingTempId(qTempId);
    setDraft({
      text: q.text ?? '',
      qtype: q.qtype ?? CreateQuestionRequestQtype.SINGLE_CHOICE,
      linkedTraitIds,
      options: (q.options ?? []).map((o) => ({
        tempId: id('dopt'),
        label: o.label ?? '',
        weightsByTraitId: ensureWeights(o.weightsByTraitId ?? {}, linkedTraitIds),
      })),
    });
    setDraftErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function applyDraftToExistingQuestion(qTempId: string): Promise<void> {
    const e = validateDraft();
    setDraftErrors(e);
    if (Object.keys(e).length > 0) return;

    const q = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === qTempId);
    if (!q) return;

    patchQuestion(qTempId, { text: draft.text, qtype: draft.qtype });
    applyLinkedTraitsToQuestion(qTempId, draft.linkedTraitIds);

    const existingIds = q.options.map((o) => o.tempId);
    const desiredCount = draft.options.length;

    for (let i = existingIds.length; i < desiredCount; i++) {
      addOption(qTempId, i + 1, allTraitIds);
    }

    const qAfterAdd = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === qTempId);
    if (!qAfterAdd) return;

    const idsNow = qAfterAdd.options
      .slice()
      .sort((a, b) => a.ord - b.ord)
      .map((o) => o.tempId);

    for (let i = desiredCount; i < idsNow.length; i++) {
      const optTempId = idsNow[i];
      const opt = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === qTempId)?.options.find((o) => o.tempId === optTempId);

      if (opt && typeof opt.optionId === 'number' && Number.isFinite(opt.optionId)) {
        try {
          const key = 'delete-option';
          message.loading({ content: 'Deleting option...', key, duration: 0 });
          await actions.deleteOption.mutateAsync({ id: opt.optionId } as any);
          message.success({ content: 'Option deleted', key, duration: 1 });
          removeOption(qTempId, optTempId);
        } catch (err: any) {
          message.error({ content: err?.message ?? 'Failed to delete option', duration: 3 });
        }
      } else {
        removeOption(qTempId, optTempId);
      }
    }

    const qFinal = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === qTempId);
    if (!qFinal) return;

    const orderedFinal = qFinal.options.slice().sort((a, b) => a.ord - b.ord);

    for (let i = 0; i < desiredCount; i++) {
      const opt = orderedFinal[i];
      if (!opt) continue;

      const dopt = draft.options[i];
      patchOption(qTempId, opt.tempId, {
        label: dopt?.label ?? '',
        weightsByTraitId: ensureWeights(dopt?.weightsByTraitId ?? {}, draft.linkedTraitIds),
      });
    }

    (async () => {
      try {
        const stNow = useAdminQuizBuilderStore.getState();
        const qLocal = stNow.questions.find((x) => x.tempId === qTempId);
        const qId = qLocal?.questionId;

        if (typeof qId === 'number' && Number.isFinite(qId)) {
          await actions.updateQuestion.mutateAsync({ id: qId, data: { text: draft.text, qtype: draft.qtype } } as any);
        }

        const qFinalNow = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === qTempId);
        const orderedNow = qFinalNow?.options.slice().sort((a, b) => a.ord - b.ord) ?? [];

        const optionPromises = orderedNow.map(async (optLocal, idx) => {
          const dopt = draft.options[idx];
          if (!dopt) return;

          if (typeof optLocal.optionId === 'number' && Number.isFinite(optLocal.optionId)) {
            await actions.updateOption.mutateAsync({ id: optLocal.optionId, data: { label: dopt.label, ord: idx + 1 } } as any);

            const weightsObj = dopt.weightsByTraitId ?? {};
            const traits = Object.keys(weightsObj)
              .map((k) => ({ traitId: Number(k), weight: (weightsObj as any)[k] }))
              .filter((x) => Number.isFinite(x.traitId) && typeof x.weight === 'number');

            if (traits.length > 0) {
              await actions.assignOptionTraits.mutateAsync({ optionId: optLocal.optionId, data: { traits } as any });
            }
          } else {
            if (typeof qId === 'number' && Number.isFinite(qId)) {
              const oRes: any = await actions.createOption.mutateAsync({
                data: { questionId: qId, label: dopt.label, ord: idx + 1 } as any,
              });
              const createdOpt = oRes?.data ?? oRes?.result ?? oRes;
              const createdOptId = typeof createdOpt?.id === 'number' ? createdOpt.id : Number(createdOpt?.id);

              if (Number.isFinite(createdOptId)) {
                patchOption(qTempId, optLocal.tempId, { optionId: createdOptId });

                const weightsObj = dopt.weightsByTraitId ?? {};
                const traits = Object.keys(weightsObj)
                  .map((k) => ({ traitId: Number(k), weight: (weightsObj as any)[k] }))
                  .filter((x) => Number.isFinite(x.traitId) && typeof x.weight === 'number');

                if (traits.length > 0) {
                  await actions.assignOptionTraits.mutateAsync({ optionId: createdOptId, data: { traits } as any });
                }
              }
            }
          }
        });

        await Promise.all(optionPromises);
        message.success({ content: 'Changes saved', duration: 2 });
      } catch (err: any) {
        message.error({ content: err?.message ?? 'Failed to save changes', duration: 4 });
      }
    })();

    resetDraft();
  }

  async function commitDraftToStore(): Promise<void> {
    const e = validateDraft();
    setDraftErrors(e);
    if (Object.keys(e).length > 0) return;

    const ord = (questions.at(-1)?.ord ?? 0) + 1;

    if (typeof storeQuizId === 'number' && typeof storeQuizVersionId === 'number') {
      addQuestion({ ord, qtype: draft.qtype, text: draft.text, linkedTraitIds: draft.linkedTraitIds }, allTraitIds);

      const st = useAdminQuizBuilderStore.getState();
      const qTempId = st.activeQuestionTempId;

      if (!qTempId) {
        message.error({ content: 'Failed to create local question', duration: 3 });
        return;
      }

      const qNow = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === qTempId);
      if (qNow) {
        for (let i = (qNow.options?.length ?? 0); i < draft.options.length; i++) {
          addOption(qTempId, i + 1, allTraitIds);
        }

        const ordered =
          useAdminQuizBuilderStore
            .getState()
            .questions.find((x) => x.tempId === qTempId)
            ?.options.slice()
            .sort((a, b) => a.ord - b.ord) ?? [];

        for (let i = 0; i < draft.options.length; i++) {
          const localOpt = ordered[i] ?? ordered.at(-1);
          if (!localOpt) continue;
          const dopt = draft.options[i];
          patchOption(qTempId, localOpt.tempId, {
            label: dopt.label ?? '',
            weightsByTraitId: ensureWeights(dopt.weightsByTraitId ?? {}, draft.linkedTraitIds),
          });
        }
      }

      const savingKey = 'create-question';
      message.loading({ content: 'Creating question...', key: savingKey, duration: 0 });

      (async () => {
        try {
          const qRes: any = await actions.createQuestion.mutateAsync({ data: { qtype: draft.qtype, text: draft.text, ord } as any });
          const created = qRes?.data ?? qRes?.result ?? qRes;
          const createdId = typeof created?.id === 'number' ? created.id : Number(created?.id);
          if (!Number.isFinite(createdId)) throw new Error('Failed to create question');

          patchQuestion(qTempId, { questionId: createdId });

          const qAfterAdd = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === qTempId);
          const orderedLocal = qAfterAdd?.options.slice().sort((a, b) => a.ord - b.ord) ?? [];

          const createPromises = draft.options.map((dopt, i) =>
            actions.createOption
              .mutateAsync({ data: { questionId: createdId, label: dopt.label, ord: i + 1 } as any })
              .then((oRes: any) => {
                const createdOpt = oRes?.data ?? oRes?.result ?? oRes;
                const createdOptId = typeof createdOpt?.id === 'number' ? createdOpt.id : Number(createdOpt?.id);
                return { index: i, createdOptId };
              }),
          );

          const createdOpts = await Promise.all(createPromises);

          const assignPromises: Promise<any>[] = [];
          for (const { index, createdOptId } of createdOpts) {
            const local = orderedLocal[index];
            if (!local) continue;

            const dopt = draft.options[index];
            patchOption(qTempId, local.tempId, {
              optionId: createdOptId,
              label: dopt.label,
              weightsByTraitId: ensureWeights(dopt.weightsByTraitId ?? {}, draft.linkedTraitIds),
            });

            const weightsObj = dopt.weightsByTraitId ?? {};
            const traits = Object.keys(weightsObj)
              .map((k) => ({ traitId: Number(k), weight: (weightsObj as any)[k] }))
              .filter((x) => Number.isFinite(x.traitId) && typeof x.weight === 'number');

            if (traits.length > 0) {
              assignPromises.push(actions.assignOptionTraits.mutateAsync({ optionId: createdOptId, data: { traits } as any }));
            }
          }

          if (assignPromises.length > 0) await Promise.all(assignPromises);

          message.success({ content: 'Question created', key: savingKey, duration: 2 });
          resetDraft();
        } catch (err: any) {
          const msg = err?.message ?? 'Failed to create question';
          message.error({ content: msg, key: savingKey, duration: 4 });

          try {
            const stateNow = useAdminQuizBuilderStore.getState();
            const qLocal = stateNow.questions.find((x) => x.tempId === qTempId);
            if (qLocal && !qLocal.questionId) {
              removeQuestion(qTempId);
              resetDraft();
            }
          } catch {}
        }
      })();

      return;
    }

    addQuestion({ ord, qtype: draft.qtype, text: draft.text, linkedTraitIds: draft.linkedTraitIds }, allTraitIds);

    const st = useAdminQuizBuilderStore.getState();
    const qTempId = st.activeQuestionTempId;
    if (!qTempId) return;

    applyLinkedTraitsToQuestion(qTempId, draft.linkedTraitIds);
    patchQuestion(qTempId, { text: draft.text, qtype: draft.qtype });

    const q = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === qTempId);
    if (!q) return;

    const first = q.options[0];
    if (first) {
      patchOption(qTempId, first.tempId, {
        label: draft.options[0]?.label ?? '',
        weightsByTraitId: ensureWeights(draft.options[0]?.weightsByTraitId ?? {}, draft.linkedTraitIds),
      });
    }

    for (let i = 1; i < draft.options.length; i++) {
      const ordOpt = i + 1;
      addOption(qTempId, ordOpt, allTraitIds);

      const q2 = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === qTempId);
      const created = q2?.options.find((x) => x.ord === ordOpt) ?? q2?.options.at(-1);
      if (!created) continue;

      patchOption(qTempId, created.tempId, {
        label: draft.options[i]?.label ?? '',
        weightsByTraitId: ensureWeights(draft.options[i]?.weightsByTraitId ?? {}, draft.linkedTraitIds),
      });
    }

    resetDraft();
  }

  const summaryItems = useMemo(() => {
    if (!v.submitAttempted) return [];
    const items: Array<{ field: string; label: string }> = [];

    if (errors.questions) items.push({ field: 'questions', label: t('title') });

    for (const { field } of v.visibleErrors) {
      const qk = parseQuestionKey(field);
      if (qk) {
        const q = questions.find((x) => x.tempId === qk.tempId);
        const qTitle = q?.text?.trim() ? q.text : t('untitledQuestion');
        items.push({ field, label: `${qTitle}` });
        continue;
      }

      const ok = parseOptionKey(field);
      if (ok) {
        items.push({ field, label: t('options') });
        continue;
      }
    }

    return items;
  }, [v.visibleErrors, v.submitAttempted, errors.questions, questions, t]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <StepValidationSummary title={t('validation.fixErrors')} items={summaryItems} />

      {questions.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={async ({ active: a, over }) => {
            if (!over) return;
            if (a.id === over.id) return;

            const prev = useAdminQuizBuilderStore.getState().questions;
            const fromIndex = prev.findIndex((q) => q.tempId === String(a.id));
            const toIndex = prev.findIndex((q) => q.tempId === String(over.id));
            if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

            reorderQuestions(String(a.id), String(over.id));

            const canPersist = prev.every((q) => toId(q.questionId));
            if (!canPersist) {
              message.info('Порядок сохранится после того, как все вопросы будут созданы на сервере');
              return;
            }

            const key = 'reorder-questions';
            message.loading({ content: 'Saving order...', key, duration: 0 });

            try {
              const run = async () => {
                await persistQuestionOrderMove({
                  questions: prev.map((q) => ({ questionId: q.questionId, ord: q.ord })),
                  fromIndex,
                  toIndex,
                  updateOrder: async (qid, ord) => actions.updateQuestionOrder.mutateAsync({ id: qid, ord } as any),
                });
              };

              const prevInFlight = reorderInFlightRef.current;
              const p = prevInFlight ? prevInFlight.then(run, run) : run();
              reorderInFlightRef.current = p;

              await p;

              if (reorderInFlightRef.current === p) reorderInFlightRef.current = null;
              message.success({ content: 'Order saved', key, duration: 1 });
            } catch (err: any) {
              reorderInFlightRef.current = null;
              message.error({ content: err?.message ?? 'Failed to save order', key, duration: 3 });
            }
          }}
        >
          <SortableContext items={questions.map((q) => q.tempId)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {questions.map((q) => {
                const errPairs = v.submitAttempted ? getQuestionErrorPairs(q.tempId) : [];

                const traitIdsForQ: number[] =
                  Array.isArray(q.linkedTraitIds) && q.linkedTraitIds.length > 0
                    ? q.linkedTraitIds
                    : Array.from(
                        q.options
                          .flatMap((o: any) => Object.keys(o.weightsByTraitId ?? {}).map((k) => Number(k)))
                          .filter((n: number) => Number.isFinite(n)),
                      );

                const influenceLines: string[] = [];
                for (const tid of traitIdsForQ) {
                  const trait = availableTraits.find((x) => x.traitId === tid);
                  const label = trait ? trait.name : `trait ${tid}`;
                  const vals = q.options
                    .map((o: any) => (o.weightsByTraitId ? o.weightsByTraitId[tid] : undefined))
                    .filter((vv: any) => typeof vv === 'number') as number[];
                  if (vals.length === 0) continue;
                  const min = Math.min(...vals);
                  const max = Math.max(...vals);
                  const range = min === max ? `${min}` : `${min}..${max}`;
                  influenceLines.push(`${label}: ${range}`);
                }

                return (
                  <SortableQuestionCard
                    key={q.tempId}
                    id={q.tempId}
                    active={editingTempId === q.tempId}
                    title={q.text.trim() ? q.text : t('untitledQuestion')}
                    typeLabel={`${t('typeLabel')}: ${q.qtype}`}
                    optionsPreview={q.options.map((o) => (o.label.trim() ? o.label : t('emptyOption')))}
                    influenceLines={influenceLines}
                    onEdit={() => startEditQuestion(q.tempId)}
                    onRemove={() => {
                      const qId = q.questionId;
                      Modal.confirm({
                        title: t('confirmDeleteQuestion.title'),
                        content: t('confirmDeleteQuestion.content'),
                        okText: t('confirm'),
                        okType: 'danger',
                        cancelText: t('cancel'),
                        onOk: async () => {
                          if (typeof qId === 'number' && Number.isFinite(qId)) {
                            const key = 'delete-question';
                            message.loading({ content: 'Deleting question...', key, duration: 0 });
                            try {
                              await actions.deleteQuestion.mutateAsync({ id: qId } as any);
                              removeQuestion(q.tempId);
                              message.success({ content: 'Question deleted', key, duration: 2 });
                            } catch (err: any) {
                              message.error({ content: err?.message ?? 'Failed to delete question', key, duration: 3 });
                            }
                          } else {
                            removeQuestion(q.tempId);
                          }

                          if (editingTempId === q.tempId) resetDraft();
                        },
                      });
                    }}
                    errors={errPairs}
                    removeLabel={t('remove')}
                    editLabel={t('edit')}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}

      <SectionCard title={editingTempId ? t('editorTitleEdit') : t('editorTitleNew')}>
        <div className="flex flex-col gap-4">
          <div>
            <Typography.Text className="block">{t('questionText')}</Typography.Text>
            <Input
              value={draft.text}
              onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
              size="large"
              placeholder={t('questionTextPh')}
            />
            {draftErrors.draftText ? <FieldError code={draftErrors.draftText} /> : null}
          </div>

          <div>
            <Typography.Text className="block">{t('questionType')}</Typography.Text>
            <Select
              value={draft.qtype}
              onChange={(vv) => onDraftTypeChange(String(vv))}
              className="w-full"
              size="large"
              options={[
                { value: CreateQuestionRequestQtype.SINGLE_CHOICE, label: t('types.single') },
                { value: CreateQuestionRequestQtype.MULTI_CHOICE, label: t('types.multi') },
                { value: CreateQuestionRequestQtype.LIKER_SCALE_5, label: t('types.likert5') },
              ]}
            />
            {draftErrors.draftType ? <FieldError code={draftErrors.draftType} /> : null}
          </div>

          <div>
            <Typography.Text className="block">{t('selectTraits')}</Typography.Text>
            <Select
              value={draft.linkedTraitIds}
              onChange={(vv) => onDraftTraitsChange(vv as number[])}
              mode="multiple"
              className="w-full"
              size="large"
              optionFilterProp="label"
              options={availableTraits.map((x) => ({ value: x.traitId, label: x.name }))}
              placeholder={t('selectTraitsPh')}
            />
            {draftErrors.draftTraits ? <FieldError code={draftErrors.draftTraits} /> : null}
          </div>

          <div className="flex flex-col gap-3">
            <Typography.Text className="block font-medium">{t('options')}</Typography.Text>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active: a, over }) => {
                if (!over) return;
                if (a.id === over.id) return;

                setDraft((d) => {
                  const ids = d.options.map((x) => x.tempId);
                  const from = ids.indexOf(String(a.id));
                  const to = ids.indexOf(String(over.id));
                  if (from === -1 || to === -1 || from === to) return d;
                  return { ...d, options: arrayMove(d.options, from, to) };
                });
              }}
            >
              <SortableContext items={draft.options.map((o) => o.tempId)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {draft.options.map((o) => (
                    <SortableOptionRow
                      key={o.tempId}
                      id={o.tempId}
                      label={o.label}
                      placeholder={t('optionPh')}
                      disableRemove={draft.options.length <= 1 || draft.qtype === CreateQuestionRequestQtype.LIKER_SCALE_5}
                      onChange={(vv) => patchDraftOption(o.tempId, { label: vv })}
                      onRemove={() => removeDraftOption(o.tempId)}
                      error={draftErrors[`draftOpt.${o.tempId}.label`]}
                      renderWeights={() =>
                        renderWeightsBlock(draftLinkedTraits, o.weightsByTraitId ?? {}, (next) =>
                          patchDraftOption(o.tempId, { weightsByTraitId: next }),
                        )
                      }
                      removeLabel={t('remove')}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex items-center justify-between gap-3">
              <Button onClick={addDraftOption} disabled={draft.qtype === CreateQuestionRequestQtype.LIKER_SCALE_5}>
                {t('addOption')}
              </Button>
              {draftErrors.draftOptions ? <FieldError code={draftErrors.draftOptions} /> : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            {editingTempId ? (
              <>
                <Button onClick={resetDraft}>{t('cancelEdit')}</Button>
                <Button type="primary" size="large" onClick={() => applyDraftToExistingQuestion(editingTempId)}>
                  {t('saveChanges')}
                </Button>
              </>
            ) : (
              <Button type="primary" size="large" onClick={commitDraftToStore}>
                {t('addThisQuestion')}
              </Button>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
