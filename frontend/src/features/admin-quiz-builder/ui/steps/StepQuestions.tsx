'use client';

import { useEffect, useMemo } from 'react';
import { Button, Card, Input, Select, Typography, InputNumber } from 'antd';
import { useTranslations } from 'next-intl';

import { SectionCard } from '../SectionCard';
import { FieldError } from '../FieldError';
import { useAdminQuizBuilderStore } from '../../model/store';

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
    if (!activeQuestionTempId) return questions.at(-1) ?? null;
    return questions.find((q) => q.tempId === activeQuestionTempId) ?? (questions.at(-1) ?? null);
  }, [activeQuestionTempId, questions]);

  useEffect(() => {
    if (!active && questions.length === 0) {
      setActiveQuestion(undefined);
    }
    if (!activeQuestionTempId && questions.length > 0) {
      setActiveQuestion(questions.at(-1)?.tempId);
    }
  }, [questions.length]);

  function getQuestionError(tempId: string, field: string) {
    return errors[`q.${tempId}.${field}`];
  }

  function getOptionError(optionTempId: string, field: string) {
    return errors[`o.${optionTempId}.${field}`];
  }

  function onAddQuestion() {
    const ord = (questions.at(-1)?.ord ?? 0) + 1;
    addQuestion({ ord, qtype: 'SINGLE_CHOICE', text: '' }, traitIds);
  }

  function onAddOption(questionTempId: string) {
    const q = questions.find((x) => x.tempId === questionTempId);
    const ord = (q?.options.at(-1)?.ord ?? 0) + 1;
    addOption(questionTempId, ord, traitIds);
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-3">
        <Typography.Title level={4} className="!m-0">
          {t('title')}
        </Typography.Title>
        <Button type="primary" onClick={onAddQuestion}>
          {t('addQuestion')}
        </Button>
      </div>

      {questions.length > 0 ? (
        <div className="flex flex-col gap-3">
          {questions.map((q) => {
            const isActive = active?.tempId === q.tempId;
            return (
              <Card
                key={q.tempId}
                className={`!rounded-2xl ${isActive ? 'border-indigo-300 dark:border-indigo-700' : ''}`}
                onClick={() => setActiveQuestion(q.tempId)}
                role="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {q.text.trim() ? q.text : t('untitledQuestion')}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t('typeLabel')}: {q.qtype}
                    </div>
                  </div>
                  <Button danger onClick={(e) => { e.stopPropagation(); removeQuestion(q.tempId); }}>
                    {t('remove')}
                  </Button>
                </div>

                <div className="pt-3 text-sm text-slate-600 dark:text-slate-300">
                  {q.options.slice(0, 4).map((o) => (
                    <div key={o.tempId} className="truncate">
                      • {o.label.trim() ? o.label : t('emptyOption')}
                    </div>
                  ))}
                  {q.options.length > 4 ? <div>…</div> : null}
                </div>

                <div className="flex flex-col gap-1 pt-3">
                  <FieldError code={getQuestionError(q.tempId, 'text')} />
                  <FieldError code={getQuestionError(q.tempId, 'qtype')} />
                  <FieldError code={getQuestionError(q.tempId, 'options')} />
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      <SectionCard title={active ? t('editorTitle') : t('editorTitleNew')}>
        {active ? (
          <div className="flex flex-col gap-4">
            <div>
              <Typography.Text className="block">{t('questionText')}</Typography.Text>
              <Input
                value={active.text}
                onChange={(e) => patchQuestion(active.tempId, { text: e.target.value })}
                size="large"
                placeholder={t('questionTextPh')}
              />
              <FieldError code={getQuestionError(active.tempId, 'text')} />
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
                  { value: 'LIKERT_5', label: t('types.likert5') }
                ]}
              />
              <FieldError code={getQuestionError(active.tempId, 'qtype')} />
            </div>

            <div className="flex flex-col gap-3">
              <Typography.Text className="block font-medium">{t('options')}</Typography.Text>

              <div className="flex flex-col gap-3">
                {active.options.map((o) => (
                  <Card key={o.tempId} size="small" className="!rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <Input
                          value={o.label}
                          onChange={(e) =>
                            patchOption(active.tempId, o.tempId, { label: e.target.value })
                          }
                          placeholder={t('optionPh')}
                        />
                        <FieldError code={getOptionError(o.tempId, 'label')} />
                      </div>

                      <Button
                        danger
                        onClick={() => removeOption(active.tempId, o.tempId)}
                        disabled={active.options.length <= 1}
                      >
                        {t('remove')}
                      </Button>
                    </div>

                    {traits.length > 0 ? (
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
                                value={o.weightsByTraitId?.[tr.traitId] ?? 0}
                                onChange={(v) => {
                                  const next = { ...(o.weightsByTraitId ?? {}) };
                                  next[tr.traitId] = typeof v === 'number' ? v : 0;
                                  patchOption(active.tempId, o.tempId, { weightsByTraitId: next });
                                }}
                                step={0.25}
                                className="w-28"
                              />
                            </div>
                          ))}
                        </div>

                        <FieldError code={getOptionError(o.tempId, 'weights')} />
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Typography.Text type="secondary">{t('noTraitsYet')}</Typography.Text>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <div>
                <Button onClick={() => onAddOption(active.tempId)}>{t('addOption')}</Button>
                <FieldError code={getQuestionError(active.tempId, 'options')} />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <Typography.Text type="secondary">{t('noQuestionsYet')}</Typography.Text>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
