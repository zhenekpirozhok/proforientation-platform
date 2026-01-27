'use client';

import { useMemo } from 'react';
import { AdminEntityTranslationsPage } from '@/features/admin-quiz-translations/ui/AdminEntityTranslationsPage';
import { PROFESSION_TRANSLATIONS_CONFIG } from '@/features/admin-quiz-translations/model/entityConfigs';
import { useProfession } from '@/entities/profession/api/useProfession';

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export default function ProfessionTranslationsClient(props: {
  quizId: number;
  professionId: number;
}) {
  const { quizId, professionId } = props;

  const professionQ = useProfession(professionId);
  const profession = (
    professionQ as { data?: { titleDefault?: string; description?: string } }
  )?.data;

  const defaults = useMemo(
    () => ({
      title: safeString(profession?.titleDefault),
      description: safeString(profession?.description),
    }),
    [profession],
  );

  return (
    <AdminEntityTranslationsPage
      entityId={professionId}
      config={PROFESSION_TRANSLATIONS_CONFIG}
      defaults={defaults}
      backHref={`/admin/quizzes/${quizId}/translations`}
      titleKey="pageTitleProfession"
    />
  );
}
