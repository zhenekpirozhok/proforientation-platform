'use client';

import { Button, Input, Select, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { SectionCard } from '../SectionCard';
import { FieldError } from '../FieldError';
import { useAdminQuizBuilderStore } from '../../model/store';


import { useAdminCategories } from '@/entities/category/api/useAdminCategories';
import { useAdminCreateCategory } from '@/entities/category/api/useAdminCreateCategory';
import { useAdminProfessions } from '@/entities/profession/api/useAdminProfessions';
import { useAdminCreateProfession } from '@/entities/profession/api/useAdminCreateProfession';

export function StepResults({ errors }: { errors: Record<string, string> }) {
  const t = useTranslations('AdminQuizBuilder.results');

  const [results, patchResults, setResults] = useAdminQuizBuilderStore(
    (s) => [s.results, s.patchResults, s.setResults]
  ) as [
    {
      selectedCategoryIds: number[];
      selectedProfessionIds: number[];
      // ...other result fields if needed
    },
    (patch: Partial<any>) => void,
    (results: any) => void
  ];

  const categories = useAdminCategories();
  const professions = useAdminProfessions();

  const createCategory = useAdminCreateCategory();
  const createProfession = useAdminCreateProfession();

  const [catName, setCatName] = useState('');
  const [profName, setProfName] = useState('');

  const categoryOptions = useMemo(
    () => {
      const arr = Array.isArray(categories.data) ? categories.data : [];
      return arr.map((c: any) => ({
        value: c.id,
        label: c.name ?? c.code ?? c.id,
      }));
    },
    [categories.data],
  );

  const professionOptions = useMemo(
    () => {
      const arr = Array.isArray(professions.data) ? professions.data : [];
      return arr.map((p: any) => ({
        value: p.id,
        label: p.name ?? p.code ?? p.id,
      }));
    },
    [professions.data],
  );

  async function onCreateCategory() {
    try {
      const name = catName.trim();
      if (!name) return;
      await createCategory.mutateAsync({ data: { name } as any });
      setCatName('');
      message.success(t('categoryCreated'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  async function onCreateProfession() {
    try {
      const name = profName.trim();
      if (!name) return;
      await createProfession.mutateAsync({ data: { name } as any });
      setProfName('');
      message.success(t('professionCreated'));
    } catch (e) {
      message.error((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <SectionCard title={t('title')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Typography.Text className="block">{t('categories')}</Typography.Text>
            <Select
              mode="multiple"
              value={results.selectedCategoryIds}
              onChange={(ids) => patchResults({ selectedCategoryIds: ids as number[] })}
              options={categoryOptions}
              className="w-full"
              placeholder={t('categoriesPh')}
            />
            <FieldError code={errors.categories} />

            <div className="mt-2 flex gap-2">
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder={t('newCategoryPh')}
              />
              <Button
                type="primary"
                onClick={onCreateCategory}
                loading={createCategory.isPending}
              >
                {t('add')}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Typography.Text className="block">{t('professions')}</Typography.Text>
            <Select
              mode="multiple"
              value={results.selectedProfessionIds}
              onChange={(ids) => patchResults({ selectedProfessionIds: ids as number[] })}
              options={professionOptions}
              className="w-full"
              placeholder={t('professionsPh')}
            />
            <FieldError code={errors.professions} />

            <div className="mt-2 flex gap-2">
              <Input
                value={profName}
                onChange={(e) => setProfName(e.target.value)}
                placeholder={t('newProfessionPh')}
              />
              <Button
                type="primary"
                onClick={onCreateProfession}
                loading={createProfession.isPending}
              >
                {t('add')}
              </Button>
            </div>
          </div>
        </div>

        <Typography.Text type="secondary" className="mt-3 block">
          {t('note')}
        </Typography.Text>
      </SectionCard>
    </div>
  );
}
