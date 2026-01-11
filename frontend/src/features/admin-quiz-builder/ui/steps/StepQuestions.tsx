'use client';

import { Button, Input, InputNumber, Select, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { SectionCard } from '../SectionCard';
import { FieldError } from '../FieldError';
import { useAdminQuizBuilderStore } from '../../model/store';

import { useAdminTraits } from '@/entities/trait/api/useAdminTraits';
import { useQuizBuilderActions } from '@/features/admin-quiz-builder/api/useQuizBuilderActions';

function nextOrd(existing: number[]) {
  const m = existing.length ? Math.max(...existing) : 0;
  return m + 1;
}

export function StepQuestions({ errors }: { errors: Record<string, string> }) {
  const t = useTranslations('AdminQuizBuilder.questions');

  const quizId = useAdminQuizBuilderStore((s) => s.quizId);
  const version = useAdminQuizBuilderStore((s) => s.version);
  const quizVersionId = useAdminQuizBuilderStore((s) => s.quizVersionId);

  const questions = useAdminQuizBuilderStore((s) => s.questions);
  const addQuestion = useAdminQuizBuilderStore((s) => s.addQuestion);
  const patchQuestion = useAdminQuizBuilderStore((s) => s.patchQuestion);
  const removeQuestion = useAdminQuizBuilderStore((s) => s.removeQuestion);
  const addOption = useAdminQuizBuilderStore((s) => s.addOption);
  const patchOption = useAdminQuizBuilderStore((s) => s.patchOption);
  const removeOption = useAdminQuizBuilderStore((s) => s.removeOption);

  const traits = useAdminTraits();

  const traitOptions = useMemo(
    () =>
      Array.isArray(traits.data)
        ? traits.data.map((x: any) => ({
            label: `${x.name ?? x.code ?? x.id}`,
            value: x.id,
          }))
        : [],
    [traits.data],
  );

  const actions =
    typeof quizId === 'number' && typeof version === 'number'
      ? useQuizBuilderActions(quizId, version)
      : null;

  const [draftText, setDraftText] = useState('');
  const [draftType, setDraftType] = useState('single_choice');

  function addDraftQuestion() {
    const ord = nextOrd(questions.map((q) => q.ord));
    addQuestion({
      ord,
      qtype: draftType,
      text: draftText,
      options: [],
    });
    setDraftText('');
  }

  async function persistQuestion(qTempId: string) {
    if (!actions || typeof quizVersionId !== 'number') return;

    const q = questions.find((x) => x.tempId === qTempId);
    if (!q) return;

    try {
      const created = await actions.createQuestion.mutateAsync({
        data: {
          quizVersionId,
          ord: q.ord,
          qtype: q.qtype as any,
          text: q.text,
        },
      } as any);

      const questionId = (created as any).id as number | undefined;
      if (typeof questionId === 'number') patchQuestion(qTempId, { questionId });

      message.success(t('questionSaved'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  async function persistOption(qTempId: string, oTempId: string) {
    if (!actions) return;

    const q = questions.find((x) => x.tempId === qTempId);
    const o = q?.options.find((x) => x.tempId === oTempId);
    if (!q || !o || typeof q.questionId !== 'number') return;

    try {
      const created = await actions.createOption.mutateAsync({
        data: {
          questionId: q.questionId,
          ord: o.ord,
          label: o.label,
        },
      } as any);

      const optionId = (created as any).id as number | undefined;
      if (typeof optionId === 'number') {
        patchOption(qTempId, oTempId, { optionId });
      }

      message.success(t('optionSaved'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  async function persistOptionTraits(qTempId: string, oTempId: string) {
    if (!actions) return;

    const q = questions.find((x) => x.tempId === qTempId);
    const o = q?.options.find((x) => x.tempId === oTempId);
    if (!o || typeof o.optionId !== 'number') return;

    try {
      await actions.assignOptionTraits.mutateAsync({
        optionId: o.optionId,
        data: { traits: o.traits } as any,
      } as any);

      message.success(t('mappingSaved'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SectionCard title={t('title')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <Typography.Text className="block">{t('text')}</Typography.Text>
            <Input
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder={t('textPh')}
              size="large"
            />
          </div>

          <div className="sm:col-span-2">
            <Typography.Text className="block">{t('type')}</Typography.Text>
            <Select
              value={draftType}
              onChange={setDraftType}
              size="large"
              className="w-full"
              options={[
                { value: 'single_choice', label: t('typeSingle') },
                { value: 'multi_choice', label: t('typeMulti') },
                { value: 'liker_scale_5', label: t('typeLikert5') },
              ]}
            />
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Button type="primary" size="large" onClick={addDraftQuestion} disabled={!draftText.trim()}>
            {t('addQuestion')}
          </Button>
        </div>

        <FieldError code={errors.questions} />
      </SectionCard>

      <SectionCard title={t('list')}>
        <div className="flex flex-col gap-4">
          {questions.length === 0 ? (
            <Typography.Text type="secondary">{t('empty')}</Typography.Text>
          ) : null}

          {questions.map((q) => (
            <div
              key={q.tempId}
              className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                    <div className="sm:col-span-1">
                      <Typography.Text className="block">{t('ord')}</Typography.Text>
                      <InputNumber
                        value={q.ord}
                        onChange={(v) => patchQuestion(q.tempId, { ord: Number(v ?? 1) })}
                        min={1}
                        className="w-full"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Typography.Text className="block">{t('type')}</Typography.Text>
                      <Select
                        value={q.qtype}
                        onChange={(v) => patchQuestion(q.tempId, { qtype: v })}
                        className="w-full"
                        options={[
                          { value: 'single_choice', label: t('typeSingle') },
                          { value: 'multi_choice', label: t('typeMulti') },
                          { value: 'liker_scale_5', label: t('typeLikert5') },
                        ]}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Typography.Text className="block">{t('text')}</Typography.Text>
                      <Input
                        value={q.text}
                        onChange={(e) => patchQuestion(q.tempId, { text: e.target.value })}
                      />
                      <FieldError code={errors[`q.${q.tempId}.text`]} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="primary"
                      onClick={() => persistQuestion(q.tempId)}
                      disabled={!actions || !quizVersionId}
                      loading={actions?.createQuestion.isPending}
                    >
                      {q.questionId ? t('saveAgain') : t('saveQuestion')}
                    </Button>
                    <Button danger onClick={() => removeQuestion(q.tempId)}>
                      {t('removeQuestion')}
                    </Button>
                    <FieldError code={errors[`q.${q.tempId}.qtype`]} />
                    <FieldError code={errors[`q.${q.tempId}.options`]} />
                  </div>

                  <div className="mt-2 flex flex-col gap-3">
                    <Typography.Text className="block font-medium">
                      {t('options')}
                    </Typography.Text>

                    <div className="flex flex-col gap-3">
                      {q.options.map((o) => (
                        <div
                          key={o.tempId}
                          className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
                        >
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                            <div className="sm:col-span-1">
                              <Typography.Text className="block">{t('ord')}</Typography.Text>
                              <InputNumber
                                value={o.ord}
                                onChange={(v) =>
                                  patchOption(q.tempId, o.tempId, { ord: Number(v ?? 1) })
                                }
                                min={1}
                                className="w-full"
                              />
                            </div>
                            <div className="sm:col-span-5">
                              <Typography.Text className="block">{t('label')}</Typography.Text>
                              <Input
                                value={o.label}
                                onChange={(e) =>
                                  patchOption(q.tempId, o.tempId, { label: e.target.value })
                                }
                              />
                              <FieldError code={errors[`o.${o.tempId}.label`]} />
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              onClick={() => persistOption(q.tempId, o.tempId)}
                              disabled={!actions || !q.questionId}
                              loading={actions?.createOption.isPending}
                            >
                              {o.optionId ? t('saveAgain') : t('saveOption')}
                            </Button>
                            <Button
                              type="primary"
                              onClick={() => persistOptionTraits(q.tempId, o.tempId)}
                              disabled={!actions || !o.optionId}
                              loading={actions?.assignOptionTraits.isPending}
                            >
                              {t('saveMapping')}
                            </Button>
                            <Button danger onClick={() => removeOption(q.tempId, o.tempId)}>
                              {t('removeOption')}
                            </Button>
                            <FieldError code={errors[`o.${o.tempId}.traits`]} />
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <Typography.Text className="block">
                                {t('traits')}
                              </Typography.Text>
                              <Select
                                mode="multiple"
                                value={o.traits.map((x) => x.traitId)}
                                onChange={(ids) => {
                                  const next = (ids as number[]).map((traitId) => {
                                    const prev = o.traits.find((x) => x.traitId === traitId);
                                    return prev ?? { traitId, weight: 1 };
                                  });
                                  patchOption(q.tempId, o.tempId, { traits: next });
                                }}
                                options={traitOptions}
                                className="w-full"
                              />
                            </div>

                            <div className="flex flex-col gap-2">
                              <Typography.Text className="block">
                                {t('weights')}
                              </Typography.Text>
                              <div className="flex flex-col gap-2">
                                {o.traits.map((m) => (
                                  <div
                                    key={m.traitId}
                                    className="flex items-center gap-2"
                                  >
                                    <div className="min-w-0 flex-1 truncate">
                                      {traitOptions.find((x) => x.value === m.traitId)?.label ??
                                        m.traitId}
                                    </div>
                                    <InputNumber
                                      value={m.weight}
                                      onChange={(v) => {
                                        const next = o.traits.map((x) =>
                                          x.traitId === m.traitId
                                            ? { ...x, weight: Number(v ?? 0) }
                                            : x,
                                        );
                                        patchOption(q.tempId, o.tempId, { traits: next });
                                      }}
                                      className="w-28"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex">
                      <Button
                        onClick={() =>
                          addOption(q.tempId, {
                            label: '',
                            ord: nextOrd(q.options.map((o) => o.ord)),
                            traits: [],
                          })
                        }
                        disabled={!q.questionId}
                      >
                        {t('addOption')}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="sm:pl-4">
                  <FieldError code={errors[`q.${q.tempId}.options`]} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
