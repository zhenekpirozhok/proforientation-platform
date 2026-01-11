'use client';

import { Button, Input, Select, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { SectionCard } from '../SectionCard';
import { FieldError } from '../FieldError';
import { useAdminQuizBuilderStore } from '../../model/store';
import { useAdminTraits } from '@/entities/trait/api/useAdminTraits';
import { useAdminCreateTrait } from '@/entities/trait/api/useAdminCreateTrait';

function slugify(v: string) {
  return v
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 32);
}

export function StepScales({ errors }: { errors: Record<string, string> }) {
  const t = useTranslations('AdminQuizBuilder.scales');

  const scales = useAdminQuizBuilderStore((s) => s.scales);
  const addScale = useAdminQuizBuilderStore((s) => s.addScale);
  const patchScale = useAdminQuizBuilderStore((s) => s.patchScale);
  const removeScale = useAdminQuizBuilderStore((s) => s.removeScale);

  const traits = useAdminTraits();
  const createTrait = useAdminCreateTrait();

  const [draftName, setDraftName] = useState('');
  const [draftCode, setDraftCode] = useState('');
  const [draftPolarity, setDraftPolarity] = useState<'single' | 'bipolar'>('single');

  const traitOptions = useMemo(
    () => {
      const arr = Array.isArray(traits.data) ? traits.data : [];
      return arr.map((x: any) => ({
        label: `${x.name ?? x.code ?? x.id}`,
        value: x.id,
      }));
    },
    [traits.data],
  );

  async function onCreateScale() {
    try {
      const name = draftName.trim();
      const code = (draftCode.trim() || slugify(name)).trim();
      if (!name || !code) {
        message.error(t('needNameCode'));
        return;
      }

      const created = await createTrait.mutateAsync({
        data: { name, code } as any,
      });

      const traitId = (created as any).id as number | undefined;

      addScale({
        name,
        code,
        polarity: draftPolarity,
        traitId,
      });

      setDraftName('');
      setDraftCode('');
      message.success(t('created'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SectionCard title={t('title')}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Typography.Text className="block">{t('name')}</Typography.Text>
              <Input
                value={draftName}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftName(v);
                  if (!draftCode.trim()) setDraftCode(slugify(v));
                }}
                placeholder={t('namePh')}
                size="large"
              />
            </div>

            <div className="sm:col-span-1">
              <Typography.Text className="block">{t('code')}</Typography.Text>
              <Input
                value={draftCode}
                onChange={(e) => setDraftCode(e.target.value)}
                placeholder={t('codePh')}
                size="large"
              />
            </div>

            <div className="sm:col-span-1">
              <Typography.Text className="block">{t('polarity')}</Typography.Text>
              <Select
                value={draftPolarity}
                onChange={(v) => setDraftPolarity(v)}
                size="large"
                options={[
                  { value: 'single', label: t('single') },
                  { value: 'bipolar', label: t('bipolar') },
                ]}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="primary"
              size="large"
              onClick={onCreateScale}
              loading={createTrait.isPending}
            >
              {t('add')}
            </Button>
          </div>

          <FieldError code={errors.scales} />
        </div>
      </SectionCard>

      <SectionCard title={t('current')}>
        <div className="flex flex-col gap-3">
          {scales.length === 0 ? (
            <Typography.Text type="secondary">{t('empty')}</Typography.Text>
          ) : null}

          <div className="flex flex-col gap-3">
            {scales.map((s) => (
              <div
                key={s.tempId}
                className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <Typography.Text className="truncate font-medium">
                      {s.name}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="truncate">
                      {s.code}
                    </Typography.Text>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tag>{s.polarity}</Tag>
                    <Button danger onClick={() => removeScale(s.tempId)}>
                      {t('remove')}
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Typography.Text className="block">
                      {t('linkTrait')}
                    </Typography.Text>
                    <Select
                      value={s.traitId}
                      onChange={(v) => patchScale(s.tempId, { traitId: v })}
                      options={traitOptions}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-end">
                    <FieldError code={errors[`scale.${s.tempId}.name`]} />
                    <FieldError code={errors[`scale.${s.tempId}.code`]} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
