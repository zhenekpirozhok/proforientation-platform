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
  const localeRaw = useLocale();
  const locale = (localeRaw?.toString().startsWith('ru') ? 'ru' : 'en') as 'ru' | 'en';

  const scales = useAdminQuizBuilderStore((s) => s.scales);
  const questions = useAdminQuizBuilderStore((s) => s.questions);
  const activeQuestionTempId = useAdminQuizBuilderStore((s) => s.activeQuestionTempId);

  const setActiveQuestion = useAdminQuizBuilderStore((s) => s.setActiveQuestion);

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

  const active = useMemo(() => {
    if (!activeQuestionTempId) return null;
    return questions.find((q) => q.tempId === activeQuestionTempId) ?? null;
  }, [activeQuestionTempId, questions]);

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

  useEffect(() => {
    setDraft((d) => ({
      ...d,
      options: d.options.map((o) => ({
        ...o,
        weightsByTraitId: ensureWeights(o.weightsByTraitId, d.linkedTraitIds),
      })),
    }));
  }, [draft.linkedTraitIds.join('|')]);

  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});

  function resetDraft() {
    setActiveQuestion(undefined);
    setDraft({
      text: '',
      qtype: 'SINGLE_CHOICE',
      linkedTraitIds: [],
      options: [{ tempId: id('dopt'), label: '', weightsByTraitId: {} }],
    });
    setDraftErrors({});
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
        const opts = likertLabels.map((label, idx) => ({
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

  const activeLinkedTraits = useMemo(() => {
    if (!active) return [];
    const allow = new Set<number>(active.linkedTraitIds ?? []);
    return availableTraits.filter((x) => allow.has(x.traitId));
  }, [active?.tempId, (active?.linkedTraitIds ?? []).join('|'), availableTraits]);

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
                onChange={(v) => {
                  const type = String(v);
                  patchQuestion(active.tempId, { qtype: type });

                  if (type === 'LIKERT_5') {
                    const traitIds = active.linkedTraitIds ?? [];
                    const st = useAdminQuizBuilderStore.getState();

                    const q = st.questions.find((x) => x.tempId === active.tempId);
                    if (!q) return;

                    const first = q.options[0];
                    if (first) {
                      patchOption(active.tempId, first.tempId, {
                        label: likertLabels[0],
                        weightsByTraitId: buildWeights(traitIds),
                      });
                    }

                    for (let i = 1; i < 5; i++) {
                      const ordOpt = i + 1;
                      if (q.options.some((o) => o.ord === ordOpt)) {
                        const existing = q.options.find((o) => o.ord === ordOpt);
                        if (existing) {
                          patchOption(active.tempId, existing.tempId, {
                            label: likertLabels[i],
                            weightsByTraitId: ensureWeights(existing.weightsByTraitId, traitIds),
                          });
                        }
                        continue;
                      }

                      addOption(active.tempId, ordOpt, allTraitIds);

                      const q2 = useAdminQuizBuilderStore.getState().questions.find((x) => x.tempId === active.tempId);
                      const created = q2?.options.find((x) => x.ord === ordOpt) ?? q2?.options.at(-1);
                      if (!created) continue;

                      patchOption(active.tempId, created.tempId, {
                        label: likertLabels[i],
                        weightsByTraitId: buildWeights(traitIds),
                      });
                    }
                  }
                }}
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

            <div>
              <Typography.Text className="block">{t('selectTraits')}</Typography.Text>
              <Select
                value={active.linkedTraitIds ?? []}
                onChange={(vals) => {
                  const next = (vals as number[]).slice(0, 2);
                  applyLinkedTraitsToQuestion(active.tempId, next);
                  if ((vals as number[]).length > 2) return;
                }}
                mode="multiple"
                className="w-full"
                size="large"
                optionFilterProp="label"
                options={availableTraits.map((x) => ({ value: x.traitId, label: x.name }))}
                placeholder={t('selectTraitsPh')}
              />
              <FieldError code={errors[`q.${active.tempId}.traits`]} />
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
                          renderWeightsBlock(activeLinkedTraits, o.weightsByTraitId ?? {}, (next) =>
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
                <Button
                  onClick={() => addOption(active.tempId, (active.options.at(-1)?.ord ?? 0) + 1, allTraitIds)}
                  disabled={active.qtype === 'LIKERT_5'}
                >
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
                        disableRemove={draft.options.length <= 1}
                        onChange={(v) => patchDraftOption(o.tempId, { label: v })}
                        onRemove={() => removeDraftOption(o.tempId)}
                        error={draftErrors[`draftOpt.${o.tempId}.label`]}
                        renderWeights={() =>
                          renderWeightsBlock(
                            availableTraits.filter((x) => draft.linkedTraitIds.includes(x.traitId)),
                            o.weightsByTraitId ?? {},
                            (next) => patchDraftOption(o.tempId, { weightsByTraitId: next }),
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
