'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Select, Typography, InputNumber } from 'antd';
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

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function buildWeights(traitIds: number[]) {
  const obj: Record<number, number> = {};
  for (const tid of traitIds) obj[tid] = 0;
  return obj;
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

function DragHandle() {
  return (
    <div className="mr-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:h-10 sm:w-10">
      <span className="select-none text-lg leading-none">⋮⋮</span>
    </div>
  );
}

function SortableQuestionCard(props: {
  id: string;
  active: boolean;
  title: string;
  typeLabel: string;
  optionsPreview: string[];
  onEdit: () => void;
  onRemove: () => void;
  errors: string[];
  removeLabel: string;
  editLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });

  const style: React.CSSProperties = {
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

        <div className="flex flex-col gap-1 pt-3">
          {props.errors.map((er, i) => (
            <FieldError key={i} code={er} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function SortableOptionRow(props: {
  id: string;
  label: string;
  placeholder: string;
  disableRemove: boolean;
  onChange: (v: string) => void;
  onRemove: () => void;
  error?: string;
  renderWeights: () => React.ReactNode;
  removeLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });

  const style: React.CSSProperties = {
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
            <FieldError code={props.error} />
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

export function StepQuestions({ errors }: { errors: Record<string, string> }) {
  const t = useTranslations('AdminQuizBuilder.questions');
  const localeRaw = useLocale();
  const locale = (localeRaw?.toString().startsWith('ru') ? 'ru' : 'en') as 'ru' | 'en';

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
  const reorderOptions = useAdminQuizBuilderStore((s) => s.reorderOptions);

  const availableTraits = useMemo(
    () =>
      scales
        .filter((s) => typeof s.traitId === 'number')
        .map((s) => ({ traitId: s.traitId as number, name: s.name })),
    [scales],
  );

  const allTraitIds = useMemo(() => availableTraits.map((x) => x.traitId), [availableTraits]);

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
    qtype: 'SINGLE_CHOICE',
    linkedTraitIds: [],
    options: [{ tempId: id('dopt'), label: '', weightsByTraitId: {} }],
  }));

  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const [editingTempId, setEditingTempId] = useState<string | null>(null);

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
      qtype: 'SINGLE_CHOICE',
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
      options: [
        ...d.options,
        { tempId: id('dopt'), label: '', weightsByTraitId: buildWeights(d.linkedTraitIds) },
      ],
    }));
  }

  function removeDraftOption(optTempId: string) {
    setDraft((d) => ({ ...d, options: d.options.filter((o) => o.tempId !== optTempId) }));
  }

  function patchDraftOption(optTempId: string, v: Partial<DraftOption>) {
    setDraft((d) => ({
      ...d,
      options: d.options.map((o) => (o.tempId === optTempId ? { ...o, ...v } : o)),
    }));
  }

  function onDraftTypeChange(v: string) {
    setDraft((d) => {
      if (v === 'LIKERT_5') {
        const opts = likertLabels.map((label) => ({
          tempId: id('dopt'),
          label,
          weightsByTraitId: buildWeights(d.linkedTraitIds),
        }));
        return { ...d, qtype: v, options: opts };
      }

      const hasAny = d.options.length > 0;
      const nextOptions = hasAny
        ? d.options.map((o) => ({ ...o, weightsByTraitId: ensureWeights(o.weightsByTraitId, d.linkedTraitIds) }))
        : [{ tempId: id('dopt'), label: '', weightsByTraitId: buildWeights(d.linkedTraitIds) }];

      return { ...d, qtype: v, options: nextOptions };
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

  function getQuestionErrors(qTempId: string) {
    return [
      errors[`q.${qTempId}.text`],
      errors[`q.${qTempId}.qtype`],
      errors[`q.${qTempId}.options`],
      errors[`q.${qTempId}.traits`],
    ].filter(Boolean) as string[];
  }

  function getOptionError(optionTempId: string) {
    return errors[`o.${optionTempId}.label`];
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
                onChange={(v) => {
                  const next = { ...(weights ?? {}) };
                  next[tr.traitId] = typeof v === 'number' ? v : 0;
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

  const draftLinkedTraits = useMemo(
    () => availableTraits.filter((x) => draft.linkedTraitIds.includes(x.traitId)),
    [availableTraits, draft.linkedTraitIds.join('|')],
  );

  function startEditQuestion(qTempId: string) {
    const q = questions.find((x) => x.tempId === qTempId);
    if (!q) return;

    const linkedTraitIds = (q.linkedTraitIds ?? []).slice(0, 2);

    setEditingTempId(qTempId);
    setDraft({
      text: q.text ?? '',
      qtype: q.qtype ?? 'SINGLE_CHOICE',
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

  function applyDraftToExistingQuestion(qTempId: string) {
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
      const optId = idsNow[i];
      removeOption(qTempId, optId);
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

    resetDraft();
  }

  function commitDraftToStore() {
    const e = validateDraft();
    setDraftErrors(e);
    if (Object.keys(e).length > 0) return;

    const ord = (questions.at(-1)?.ord ?? 0) + 1;

    addQuestion(
      { ord, qtype: draft.qtype, text: draft.text, linkedTraitIds: draft.linkedTraitIds },
      allTraitIds,
    );

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

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {questions.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active: a, over }) => {
            if (!over) return;
            if (a.id === over.id) return;
            reorderQuestions(String(a.id), String(over.id));
          }}
        >
          <SortableContext items={questions.map((q) => q.tempId)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {questions.map((q) => (
                <SortableQuestionCard
                  key={q.tempId}
                  id={q.tempId}
                  active={editingTempId === q.tempId}
                  title={q.text.trim() ? q.text : t('untitledQuestion')}
                  typeLabel={`${t('typeLabel')}: ${q.qtype}`}
                  optionsPreview={q.options.map((o) => (o.label.trim() ? o.label : t('emptyOption')))}
                  onEdit={() => startEditQuestion(q.tempId)}
                  onRemove={() => {
                    removeQuestion(q.tempId);
                    if (editingTempId === q.tempId) resetDraft();
                  }}
                  errors={getQuestionErrors(q.tempId)}
                  removeLabel={t('remove')}
                  editLabel={t('edit')}
                />
              ))}
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
            <FieldError code={draftErrors.draftText} />
          </div>

          <div>
            <Typography.Text className="block">{t('questionType')}</Typography.Text>
            <Select
              value={draft.qtype}
              onChange={(v) => onDraftTypeChange(String(v))}
              className="w-full"
              size="large"
              options={[
                { value: 'SINGLE_CHOICE', label: t('types.single') },
                { value: 'MULTI_CHOICE', label: t('types.multi') },
                { value: 'LIKERT_5', label: t('types.likert5') },
              ]}
            />
            <FieldError code={draftErrors.draftType} />
          </div>

          <div>
            <Typography.Text className="block">{t('selectTraits')}</Typography.Text>
            <Select
              value={draft.linkedTraitIds}
              onChange={(v) => onDraftTraitsChange(v as number[])}
              mode="multiple"
              className="w-full"
              size="large"
              optionFilterProp="label"
              options={availableTraits.map((x) => ({ value: x.traitId, label: x.name }))}
              placeholder={t('selectTraitsPh')}
            />
            <FieldError code={draftErrors.draftTraits} />
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
                      disableRemove={draft.options.length <= 1 || draft.qtype === 'LIKERT_5'}
                      onChange={(v) => patchDraftOption(o.tempId, { label: v })}
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
              <Button onClick={addDraftOption} disabled={draft.qtype === 'LIKERT_5'}>
                {t('addOption')}
              </Button>
              <FieldError code={draftErrors.draftOptions} />
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
