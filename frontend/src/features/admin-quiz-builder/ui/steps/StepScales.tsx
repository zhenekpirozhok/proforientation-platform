'use client';

import { useMemo, useState } from 'react';
import { Button, Card, Input, Segmented, Tag, Typography } from 'antd';
import { useTranslations } from 'next-intl';

import { SectionCard } from '../SectionCard';
import { FieldError } from '../FieldError';
import { useAdminQuizBuilderStore, type ScaleDraft, type ScaleMode } from '../../model/store';
import { generateEntityCode } from '@/shared/lib/code/generateEntityCode';

import { useStepValidation } from '../../lib/validation/useStepValidation';
import { StepValidationSummary } from '../../lib/validation/StepValidationSummary';
import { parsePairKey, parseScaleKey } from '../../lib/validation/validationKeys';

type SingleForm = {
  name: string;
  code: string;
  codeTouched: boolean;
  description: string;
};

type BipolarForm = {
  pairCode: string;
  pairCodeTouched: boolean;
  left: SingleForm;
  right: SingleForm;
};

function getScaleFieldError(errors: Record<string, string>, tempId: string, field: string) {
  return errors[`scale.${tempId}.${field}`];
}

function getPairError(errors: Record<string, string>, pairId: string) {
  return errors[`pair.${pairId}`];
}

function groupBipolar(scales: ScaleDraft[]) {
  const m = new Map<string, { left?: ScaleDraft; right?: ScaleDraft }>();
  for (const s of scales) {
    const pid = s.pairId;
    if (!pid) continue;
    const cur = m.get(pid) ?? {};
    if (s.side === 'LEFT') cur.left = s;
    if (s.side === 'RIGHT') cur.right = s;
    m.set(pid, cur);
  }
  return Array.from(m.entries()).map(([pairId, v]) => ({ pairId, ...v }));
}

export function StepScales({
  errors,
  submitAttempted,
}: {
  errors: Record<string, string>;
  submitAttempted?: boolean;
}) {
  const t = useTranslations('AdminQuizBuilder.scales');

  const v = useStepValidation({ errors, submitAttempted });

  const scaleMode = useAdminQuizBuilderStore((s) => s.scaleMode);
  const setScaleMode = useAdminQuizBuilderStore((s) => s.setScaleMode);

  const scales = useAdminQuizBuilderStore((s) => s.scales);

  const editingScaleTempId = useAdminQuizBuilderStore((s) => s.editingScaleTempId);
  const editingPairId = useAdminQuizBuilderStore((s) => s.editingPairId);
  const startEditScale = useAdminQuizBuilderStore((s) => s.startEditScale);
  const startEditPair = useAdminQuizBuilderStore((s) => s.startEditPair);
  const stopEdit = useAdminQuizBuilderStore((s) => s.stopEdit);

  const addSingleScale = useAdminQuizBuilderStore((s) => s.addSingleScale);
  const addBipolarPair = useAdminQuizBuilderStore((s) => s.addBipolarPair);
  const patchScale = useAdminQuizBuilderStore((s) => s.patchScale);
  const removeScale = useAdminQuizBuilderStore((s) => s.removeScale);
  const removePair = useAdminQuizBuilderStore((s) => s.removePair);

  const lockedMode: ScaleMode = scales.length > 0 ? (scales[0]?.polarity ?? null) : scaleMode;
  const canChooseMode = scales.length === 0;

  const isEditing = typeof editingScaleTempId === 'string' || typeof editingPairId === 'string';

  const editingScale = useMemo(() => {
    if (!editingScaleTempId) return null;
    return scales.find((s) => s.tempId === editingScaleTempId) ?? null;
  }, [editingScaleTempId, scales]);

  const bipolarPairs = useMemo(() => groupBipolar(scales), [scales]);

  const editingPair = useMemo(() => {
    if (!editingPairId) return null;
    return bipolarPairs.find((p) => p.pairId === editingPairId) ?? null;
  }, [editingPairId, bipolarPairs]);

  const [singleForm, setSingleForm] = useState<SingleForm>({
    name: '',
    code: '',
    codeTouched: false,
    description: '',
  });

  const [bipolarForm, setBipolarForm] = useState<BipolarForm>({
    pairCode: '',
    pairCodeTouched: false,
    left: { name: '', code: '', codeTouched: false, description: '' },
    right: { name: '', code: '', codeTouched: false, description: '' },
  });

  useMemo(() => {
    if (editingScale && editingScale.polarity === 'single') {
      setSingleForm({
        name: editingScale.name,
        code: editingScale.code,
        codeTouched: true,
        description: editingScale.description,
      });
    }
    if (editingPair && editingPair.left && editingPair.right) {
      const pc = editingPair.left.bipolarPairCode || editingPair.right.bipolarPairCode || '';
      setBipolarForm({
        pairCode: pc,
        pairCodeTouched: true,
        left: {
          name: editingPair.left.name,
          code: editingPair.left.code,
          codeTouched: true,
          description: editingPair.left.description,
        },
        right: {
          name: editingPair.right.name,
          code: editingPair.right.code,
          codeTouched: true,
          description: editingPair.right.description,
        },
      });
    }
    return null;
  }, [editingScale, editingPair]);

  function resetForms() {
    setSingleForm({ name: '', code: '', codeTouched: false, description: '' });
    setBipolarForm({
      pairCode: '',
      pairCodeTouched: false,
      left: { name: '', code: '', codeTouched: false, description: '' },
      right: { name: '', code: '', codeTouched: false, description: '' },
    });
  }

  function onModeChange(vv: string | number) {
    if (!canChooseMode) return;
    if (vv !== 'single' && vv !== 'bipolar') return;
    setScaleMode(vv);
    stopEdit();
    resetForms();
  }

  function onCancelEdit() {
    stopEdit();
    resetForms();
  }

  function onAddOrSaveSingle() {
    if (editingScale && editingScale.polarity === 'single') {
      patchScale(editingScale.tempId, {
        name: singleForm.name,
        code: singleForm.code,
        description: singleForm.description,
        codeTouched: true,
      });
      stopEdit();
      resetForms();
      return;
    }

    addSingleScale({
      name: singleForm.name,
      code: singleForm.code,
      description: singleForm.description,
    });
    resetForms();
  }

  function onAddOrSavePair() {
    if (editingPair && editingPair.left && editingPair.right) {
      patchScale(editingPair.left.tempId, {
        name: bipolarForm.left.name,
        code: bipolarForm.left.code,
        description: bipolarForm.left.description,
        bipolarPairCode: bipolarForm.pairCode,
        codeTouched: true,
      });
      patchScale(editingPair.right.tempId, {
        name: bipolarForm.right.name,
        code: bipolarForm.right.code,
        description: bipolarForm.right.description,
        bipolarPairCode: bipolarForm.pairCode,
        codeTouched: true,
      });
      stopEdit();
      resetForms();
      return;
    }

    addBipolarPair({
      pairCode: bipolarForm.pairCode,
      left: {
        name: bipolarForm.left.name,
        code: bipolarForm.left.code,
        description: bipolarForm.left.description,
      },
      right: {
        name: bipolarForm.right.name,
        code: bipolarForm.right.code,
        description: bipolarForm.right.description,
      },
    });
    resetForms();
  }

  const modeValue: 'single' | 'bipolar' | undefined =
    lockedMode === 'single' || lockedMode === 'bipolar' ? lockedMode : undefined;

  const hasScales = scales.length > 0;

  const summaryItems = useMemo(() => {
    if (!v.submitAttempted) return [];
    const items: Array<{ field: string; label: string }> = [];

    for (const { field } of v.visibleErrors) {
      if (field === 'scales') {
        items.push({ field: 'scales', label: t('title') });
        continue;
      }

      const sk = parseScaleKey(field);
      if (sk) {
        const s = scales.find((x) => x.tempId === sk.tempId);
        const sName = s?.name?.trim() ? s.name : t('untitled');
        const fld =
          sk.field === 'name' ? t('name') : sk.field === 'code' ? t('code') : t('description');
        items.push({ field, label: `${sName}: ${fld}` });
        continue;
      }

      const pk = parsePairKey(field);
      if (pk) {
        items.push({ field, label: `${t('pairTitle')}: ${pk.pairId}` });
        continue;
      }
    }

    return items;
  }, [v.visibleErrors, v.submitAttempted, scales, t]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SectionCard title={t('title')}>
        <div className="flex flex-col gap-4">
          <StepValidationSummary title={t('validation.fixErrors')} items={summaryItems} />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" data-field="scales">
            <div className="min-w-0">
              <Typography.Text className="block">{t('modeTitle')}</Typography.Text>
              <Typography.Text type="secondary" className="block">
                {canChooseMode ? t('modeHint') : t('modeLocked')}
              </Typography.Text>
            </div>

            <Segmented
              value={modeValue}
              disabled={!canChooseMode}
              options={[
                { label: t('mode.single'), value: 'single' },
                { label: t('mode.bipolar'), value: 'bipolar' },
              ]}
              onChange={onModeChange}
            />
          </div>

          {v.showError('scales') ? <FieldError code={errors.scales} /> : null}
        </div>
      </SectionCard>

      {hasScales ? (
        <SectionCard title={t('listTitle')}>
          {lockedMode === 'single' ? (
            <div className="flex flex-col gap-3">
              {scales.map((s) => (
                <Card
                  key={s.tempId}
                  className="!rounded-2xl"
                  title={
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{s.name || t('untitled')}</div>
                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {s.code}
                        </div>
                      </div>
                      <Tag>{t('mode.single')}</Tag>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-2">
                    <Typography.Text type="secondary">{s.description}</Typography.Text>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button onClick={() => startEditScale(s.tempId)}>{t('edit')}</Button>
                      <Button danger onClick={() => removeScale(s.tempId)}>
                        {t('remove')}
                      </Button>
                    </div>

                    <div className="flex flex-col gap-1">
                      {v.showError(`scale.${s.tempId}.name`) ? (
                        <div data-field={`scale.${s.tempId}.name`}>
                          <FieldError code={getScaleFieldError(errors, s.tempId, 'name')} />
                        </div>
                      ) : null}
                      {v.showError(`scale.${s.tempId}.code`) ? (
                        <div data-field={`scale.${s.tempId}.code`}>
                          <FieldError code={getScaleFieldError(errors, s.tempId, 'code')} />
                        </div>
                      ) : null}
                      {v.showError(`scale.${s.tempId}.description`) ? (
                        <div data-field={`scale.${s.tempId}.description`}>
                          <FieldError code={getScaleFieldError(errors, s.tempId, 'description')} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bipolarPairs.map((p) => {
                const pairErr = getPairError(errors, p.pairId);
                const pairCode = p.left?.bipolarPairCode || p.right?.bipolarPairCode || '';
                return (
                  <Card
                    key={p.pairId}
                    className="!rounded-2xl"
                    title={
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold">{t('pairTitle')}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {pairCode ? `${t('pairCode')}: ${pairCode}` : p.pairId}
                          </div>
                        </div>
                        <Tag>{t('mode.bipolar')}</Tag>
                      </div>
                    }
                  >
                    <div className="flex flex-col gap-3">
                      {v.showError(`pair.${p.pairId}`) && pairErr ? (
                        <div data-field={`pair.${p.pairId}`}>
                          <FieldError code={pairErr} />
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Card className="!rounded-2xl" size="small" title={t('left')}>
                          <div className="flex flex-col gap-2">
                            <div className="truncate font-semibold">{p.left?.name || t('untitled')}</div>
                            <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {p.left?.code}
                            </div>
                            <Typography.Text type="secondary">{p.left?.description}</Typography.Text>

                            {p.left ? (
                              <div className="flex flex-col gap-1">
                                {v.showError(`scale.${p.left.tempId}.name`) ? (
                                  <div data-field={`scale.${p.left.tempId}.name`}>
                                    <FieldError code={getScaleFieldError(errors, p.left.tempId, 'name')} />
                                  </div>
                                ) : null}
                                {v.showError(`scale.${p.left.tempId}.code`) ? (
                                  <div data-field={`scale.${p.left.tempId}.code`}>
                                    <FieldError code={getScaleFieldError(errors, p.left.tempId, 'code')} />
                                  </div>
                                ) : null}
                                {v.showError(`scale.${p.left.tempId}.description`) ? (
                                  <div data-field={`scale.${p.left.tempId}.description`}>
                                    <FieldError code={getScaleFieldError(errors, p.left.tempId, 'description')} />
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </Card>

                        <Card className="!rounded-2xl" size="small" title={t('right')}>
                          <div className="flex flex-col gap-2">
                            <div className="truncate font-semibold">{p.right?.name || t('untitled')}</div>
                            <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {p.right?.code}
                            </div>
                            <Typography.Text type="secondary">{p.right?.description}</Typography.Text>

                            {p.right ? (
                              <div className="flex flex-col gap-1">
                                {v.showError(`scale.${p.right.tempId}.name`) ? (
                                  <div data-field={`scale.${p.right.tempId}.name`}>
                                    <FieldError code={getScaleFieldError(errors, p.right.tempId, 'name')} />
                                  </div>
                                ) : null}
                                {v.showError(`scale.${p.right.tempId}.code`) ? (
                                  <div data-field={`scale.${p.right.tempId}.code`}>
                                    <FieldError code={getScaleFieldError(errors, p.right.tempId, 'code')} />
                                  </div>
                                ) : null}
                                {v.showError(`scale.${p.right.tempId}.description`) ? (
                                  <div data-field={`scale.${p.right.tempId}.description`}>
                                    <FieldError code={getScaleFieldError(errors, p.right.tempId, 'description')} />
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </Card>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => startEditPair(p.pairId)}>{t('edit')}</Button>
                        <Button danger onClick={() => removePair(p.pairId)}>
                          {t('remove')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </SectionCard>
      ) : null}

      <SectionCard title={isEditing ? t('editTitle') : t('addTitle')}>
        {lockedMode === null ? (
          <div className="py-2">
            <Typography.Text type="secondary">{t('chooseModeFirst')}</Typography.Text>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {isEditing ? (
              <div className="flex items-center justify-end">
                <Button onClick={onCancelEdit}>{t('cancel')}</Button>
              </div>
            ) : null}

            {lockedMode === 'bipolar' ? (
              <div className="flex flex-col gap-4">
                <div>
                  <Typography.Text className="block">{t('pairCode')}</Typography.Text>
                  <Input
                    value={bipolarForm.pairCode}
                    onChange={(e) => {
                      const pairCode = e.target.value;
                      setBipolarForm((p) => ({ ...p, pairCode, pairCodeTouched: true }));
                    }}
                    size="large"
                    placeholder={t('pairCodePh')}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-3">
                    <Typography.Text className="block font-medium">{t('left')}</Typography.Text>

                    <div>
                      <Typography.Text className="block">{t('name')}</Typography.Text>
                      <Input
                        value={bipolarForm.left.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setBipolarForm((p) => {
                            const next = { ...p, left: { ...p.left, name } };
                            if (!next.left.codeTouched) next.left.code = generateEntityCode(name || 'scale');
                            if (!next.pairCodeTouched && !next.pairCode.trim()) {
                              next.pairCode = generateEntityCode(`${name}_${next.right.name}`.trim() || 'pair');
                            }
                            return next;
                          });
                        }}
                        size="large"
                      />
                    </div>

                    <div>
                      <Typography.Text className="block">{t('code')}</Typography.Text>
                      <Input
                        value={bipolarForm.left.code}
                        onChange={(e) => {
                          const code = e.target.value;
                          setBipolarForm((p) => ({
                            ...p,
                            left: { ...p.left, code, codeTouched: true },
                          }));
                        }}
                        size="large"
                      />
                    </div>

                    <div>
                      <Typography.Text className="block">{t('description')}</Typography.Text>
                      <Input.TextArea
                        value={bipolarForm.left.description}
                        onChange={(e) => {
                          const description = e.target.value;
                          setBipolarForm((p) => ({
                            ...p,
                            left: { ...p.left, description },
                          }));
                        }}
                        autoSize={{ minRows: 2, maxRows: 6 }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Typography.Text className="block font-medium">{t('right')}</Typography.Text>

                    <div>
                      <Typography.Text className="block">{t('name')}</Typography.Text>
                      <Input
                        value={bipolarForm.right.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setBipolarForm((p) => {
                            const next = { ...p, right: { ...p.right, name } };
                            if (!next.right.codeTouched) next.right.code = generateEntityCode(name || 'scale');
                            if (!next.pairCodeTouched && !next.pairCode.trim()) {
                              next.pairCode = generateEntityCode(`${next.left.name}_${name}`.trim() || 'pair');
                            }
                            return next;
                          });
                        }}
                        size="large"
                      />
                    </div>

                    <div>
                      <Typography.Text className="block">{t('code')}</Typography.Text>
                      <Input
                        value={bipolarForm.right.code}
                        onChange={(e) => {
                          const code = e.target.value;
                          setBipolarForm((p) => ({
                            ...p,
                            right: { ...p.right, code, codeTouched: true },
                          }));
                        }}
                        size="large"
                      />
                    </div>

                    <div>
                      <Typography.Text className="block">{t('description')}</Typography.Text>
                      <Input.TextArea
                        value={bipolarForm.right.description}
                        onChange={(e) => {
                          const description = e.target.value;
                          setBipolarForm((p) => ({
                            ...p,
                            right: { ...p.right, description },
                          }));
                        }}
                        autoSize={{ minRows: 2, maxRows: 6 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Button type="primary" size="large" onClick={onAddOrSavePair}>
                    {isEditing ? t('save') : t('add')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <Typography.Text className="block">{t('name')}</Typography.Text>
                  <Input
                    value={singleForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setSingleForm((p) => {
                        const next = { ...p, name };
                        if (!next.codeTouched) next.code = generateEntityCode(name || 'scale');
                        return next;
                      });
                    }}
                    size="large"
                  />
                </div>

                <div>
                  <Typography.Text className="block">{t('code')}</Typography.Text>
                  <Input
                    value={singleForm.code}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSingleForm((p) => ({ ...p, code, codeTouched: true }));
                    }}
                    size="large"
                  />
                </div>

                <div>
                  <Typography.Text className="block">{t('description')}</Typography.Text>
                  <Input.TextArea
                    value={singleForm.description}
                    onChange={(e) => {
                      const description = e.target.value;
                      setSingleForm((p) => ({ ...p, description }));
                    }}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                  />
                </div>

                <div className="flex items-center justify-end">
                  <Button type="primary" size="large" onClick={onAddOrSaveSingle}>
                    {isEditing ? t('save') : t('add')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
