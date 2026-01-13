// features/admin-quiz-builder/ui/steps/StepQuestions.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Select, Typography, InputNumber } from 'antd';
import { useTranslations } from 'next-intl';

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
  const next = { ...current };
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
  onClick: () => void;
  onRemove: () => void;
  errors: string[];
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
      <Card
        className={`!rounded-2xl ${props.active ? 'border-indigo-300 dark:border-indigo-700' : ''}`}
        role="button"
        onClick={props.onClick}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start">
            <div {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
              <DragHandle />
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{props.title}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{props.typeLabel}</div>
            </div>
          </div>

          <Button
            danger
            onClick={(e) => {
              e.stopPropagation();
              props.onRemove();
            }}
          >
            {props.removeLabel}
          </Button>
        </div>

        <div className="pt-3 text-sm text-slate-600 dark:text-slate-300">
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

  const scales = useAdminQuizBuilderStore((s) => s.scales);
  const questions = useAdminQuizBuilderStore((s) => s.questions);
  const activeQuestionTempId = useAdminQuizBuilderStore((s) => s.activeQuestionTempId);

  const setActiveQuestion = useAdminQuizBuilderStore((s) => s.setActiveQuestion);

  const addQuestion = useAdminQuizBuilderStore((s) => s.addQuestion);
  const patchQuestion = useAdminQuizBuilderStore((s) => s.patchQuestion);
  const removeQuestion = useAdminQuizBuilderStore((s) => s.removeQuestion);

  const addOption = useAdminQuizBuilderStore((s) => s.addOption);
  const patchOption = useAdminQuizBuilderStore((s) => s.patchOption);
  const removeOption = useAdminQuizBuilderStore((s) => s.removeOption);

  const syncOptionWeightsWithTraits = useAdminQuizBuilderStore((s) => s.syncOptionWeightsWithTraits);

  const reorderQuestions = useAdminQuizBuilderStore((s) => s.reorderQuestions);
  const reorderOptions = useAdminQuizBuilderStore((s) => s.reorderOptions);

  const traitIds = useMemo(
    () => scales.map((s) => s.traitId).filter((x): x is number => typeof x === 'number'),
    [scales],
  );

  const traits = useMemo(
    () =>
      scales
        .filter((s) => typeof s.traitId === 'number')
        .map((s) => ({ traitId: s.traitId as number, name: s.name })),
    [scales],
  );

  useEffect(() => {
    syncOptionWeightsWithTraits(traitIds);
  }, [traitIds.join('|')]);

  const active = useMemo(() => {
    if (!activeQuestionTempId) return null;
    return questions.find((q) => q.tempId === activeQuestionTempId) ?? null;
  }, [activeQuestionTempId, questions]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [draft, setDraft] = useState<DraftQuestion>(() => ({
    text: '',
    qtype: 'SINGLE_CHOICE',
    options: [{ tempId: id('dopt'), label: '', weightsByTraitId: buildWeights(traitIds) }],
  }));

  useEffect(() => {
    setDraft((d) => ({
      ...d,
      options: d.options.map((o) => ({ ...o, weightsByTraitId: ensureWeights(o.weightsByTraitId, traitIds) })),
    }));
  }, [traitIds.join('|')]);

  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});

  function resetDraft() {
    setActiveQuestion(undefined);
    setDraft({
      text: '',
      qtype: 'SINGLE_CHOICE',
      options: [{ tempId: id('dopt'), label: '', weightsByTraitId: buildWeights(traitIds) }],
    });
    setDraftErrors({});
  }

  function validateDraft() {
    const e: Record<string, string> = {};
    if (!draft.text.trim()) e.draftText = 'required';
    if (!draft.qtype.trim()) e.draftType = 'required';
    if (draft.options.length < 2) e.draftOptions = 'min2';
    for (const o of draft.options) if (!o.label.trim()) e[`draftOpt.${o.tempId}.label`] = 'required';
    return e;
  }

  function addDraftOption() {
    setDraft((d) => ({
      ...d,
      options: [...d.options, { tempId: id('dopt'), label: '', weightsByTraitId: buildWeights(traitIds) }],
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

  function commitDraftToStore() {
    const e = validateDraft();
    setDraftErrors(e);
    if (Object.keys(e).length > 0) return;

    const ord = (questions.at(-1)?.ord ?? 0) + 1;

    addQuestion({ ord, qtype: draft.qtype, text: draft.text }, traitIds);

    const st = useAdminQuizBuilderStore.getState();
    const qTempId = st.activeQuestionTempId;
    if (!qTempId) return;

    patchQuestion(qTempId, { text: draft.text, qtype: draft.qtype });

    const q = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === qTempId);
    if (!q) return;

    const first = q.options[0];
    if (first) {
      patchOption(qTempId, first.tempId, {
        label: draft.options[0]?.label ?? '',
        weightsByTraitId: draft.options[0]?.weightsByTraitId ?? buildWeights(traitIds),
      });
    }

    for (let i = 1; i < draft.options.length; i++) {
      const ordOpt = i + 1;
      addOption(qTempId, ordOpt, traitIds);

      const q2 = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === qTempId);
      const created = q2?.options.find((x) => x.ord === ordOpt) ?? q2?.options.at(-1);
      if (!created) continue;

      patchOption(qTempId, created.tempId, {
        label: draft.options[i]?.label ?? '',
        weightsByTraitId: draft.options[i]?.weightsByTraitId ?? buildWeights(traitIds),
      });
    }

    resetDraft();
  }

  function getQuestionErrors(qTempId: string) {
    return [errors[`q.${qTempId}.text`], errors[`q.${qTempId}.qtype`], errors[`q.${qTempId}.options`]].filter(
      Boolean,
    ) as string[];
  }

  function getOptionError(optionTempId: string) {
    return errors[`o.${optionTempId}.label`];
  }

  function renderWeightsBlock(weights: Record<number, number>, onChange: (next: Record<number, number>) => void) {
    if (traits.length === 0) {
      return (
        <div className="mt-3">
          <Typography.Text type="secondary">{t('noTraitsYet')}</Typography.Text>
        </div>
      );
    }

    return (
      <div className="mt-4">
        <Typography.Text type="secondary" className="block">
          {t('weightsTitle')}
        </Typography.Text>

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {traits.map((tr) => (
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
                  active={active?.tempId === q.tempId}
                  title={q.text.trim() ? q.text : t('untitledQuestion')}
                  typeLabel={`${t('typeLabel')}: ${q.qtype}`}
                  optionsPreview={q.options.slice(0, 4).map((o) => (o.label.trim() ? o.label : t('emptyOption')))}
                  onClick={() => setActiveQuestion(q.tempId)}
                  onRemove={() => removeQuestion(q.tempId)}
                  errors={getQuestionErrors(q.tempId)}
                  removeLabel={t('remove')}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}

      <SectionCard title={active ? t('editorTitle') : t('editorTitleNew')}>
        {active ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-end">
              <Button onClick={resetDraft}>{t('newQuestion')}</Button>
            </div>

            <div>
              <Typography.Text className="block">{t('questionText')}</Typography.Text>
              <Input
                value={active.text}
                onChange={(e) => patchQuestion(active.tempId, { text: e.target.value })}
                size="large"
                placeholder={t('questionTextPh')}
              />
              <FieldError code={errors[`q.${active.tempId}.text`]} />
            </div>

            <div>
              <Typography.Text className="block">{t('questionType')}</Typography.Text>
              <Select
                value={active.qtype}
                onChange={(v) => patchQuestion(active.tempId, { qtype: String(v) })}
                className="w-full"
                size="large"
                options={[
                  { value: 'SINGLE_CHOICE', label: t('types.single') },
                  { value: 'MULTI_CHOICE', label: t('types.multi') },
                  { value: 'LIKERT_5', label: t('types.likert5') },
                ]}
              />
              <FieldError code={errors[`q.${active.tempId}.qtype`]} />
            </div>

            <div className="flex flex-col gap-3">
              <Typography.Text className="block font-medium">{t('options')}</Typography.Text>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={({ active: a, over }) => {
                  if (!over) return;
                  if (a.id === over.id) return;
                  reorderOptions(active.tempId, String(a.id), String(over.id));
                }}
              >
                <SortableContext items={active.options.map((o) => o.tempId)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-3">
                    {active.options.map((o) => (
                      <SortableOptionRow
                        key={o.tempId}
                        id={o.tempId}
                        label={o.label}
                        placeholder={t('optionPh')}
                        disableRemove={active.options.length <= 1}
                        onChange={(v) => patchOption(active.tempId, o.tempId, { label: v })}
                        onRemove={() => removeOption(active.tempId, o.tempId)}
                        error={getOptionError(o.tempId)}
                        renderWeights={() =>
                          renderWeightsBlock(o.weightsByTraitId ?? {}, (next) =>
                            patchOption(active.tempId, o.tempId, { weightsByTraitId: next }),
                          )
                        }
                        removeLabel={t('remove')}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex items-center justify-between gap-3">
                <Button onClick={() => addOption(active.tempId, (active.options.at(-1)?.ord ?? 0) + 1, traitIds)}>
                  {t('addOption')}
                </Button>
                <FieldError code={errors[`q.${active.tempId}.options`]} />
              </div>
            </div>
          </div>
        ) : (
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
                onChange={(v) => setDraft((d) => ({ ...d, qtype: String(v) }))}
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
                        disableRemove={draft.options.length <= 1}
                        onChange={(v) => patchDraftOption(o.tempId, { label: v })}
                        onRemove={() => removeDraftOption(o.tempId)}
                        error={draftErrors[`draftOpt.${o.tempId}.label`]}
                        renderWeights={() =>
                          renderWeightsBlock(o.weightsByTraitId ?? {}, (next) => patchDraftOption(o.tempId, { weightsByTraitId: next }))
                        }
                        removeLabel={t('remove')}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex items-center justify-between gap-3">
                <Button onClick={addDraftOption}>{t('addOption')}</Button>
                <FieldError code={draftErrors.draftOptions} />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button type="primary" size="large" onClick={commitDraftToStore}>
                {t('addThisQuestion')}
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
