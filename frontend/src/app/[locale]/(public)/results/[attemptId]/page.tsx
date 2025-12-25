'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations, type _Translator } from 'next-intl';
import { useQuery } from '@tanstack/react-query';

import { useQuizPlayerStore } from '@/features/quiz-player/model/store';
import type { AttemptResult } from '@/features/quiz-player/model/types';
import { parseResponse } from '@/shared/api/parseResponse';

type TraitDto = {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
};

type ProfessionDto = {
  id?: number;
  name?: string;
  description?: string;
  categoryId?: number;
};

type CatalogDto = {
  quizId: number;
  categoryId: number;
  traits: TraitDto[];
  professions: ProfessionDto[];
};

async function fetchCatalog(locale: string, quizId: number) {
  const res = await fetch(`/api/results/catalog?quizId=${quizId}`, {
    method: 'GET',
    headers: { 'x-locale': locale },
    cache: 'no-store',
  });
  return parseResponse<CatalogDto>(res);
}

function safeProfessionTitle(
  rec: { professionId: number; explanation?: string },
  prof: ProfessionDto | null,
  t: _Translator,
) {
  const apiName = prof?.name?.trim();
  if (apiName) return apiName;

  const fromExplanation = (rec.explanation ?? '')
    .replace('Predicted as: ', '')
    .trim();
  if (fromExplanation) return fromExplanation;

  return t('Results.fallbackProfessionTitle', { id: rec.professionId });
}

export default function ResultPage() {
  const t = useTranslations();
  const params = useParams<{ attemptId?: string }>();
  const locale = useLocale();
  const router = useRouter();

  const quizId = useQuizPlayerStore((s) => s.quizId);
  const storedAttemptId = useQuizPlayerStore((s) => s.attemptId);
  const storedResult = useQuizPlayerStore((s) => s.result);

  const attemptIdStr = params?.attemptId;
  const attemptIdFromUrl = attemptIdStr ? Number(attemptIdStr) : NaN;
  const attemptIdReady = Boolean(attemptIdStr);
  const attemptIdValid = Number.isFinite(attemptIdFromUrl);

  const hasStoreResult =
    attemptIdValid &&
    storedAttemptId === attemptIdFromUrl &&
    storedResult != null;

  const goToQuiz = () => {
    const safeQuizId = Number.isFinite(quizId) && quizId > 0 ? quizId : 1;
    router.push(`/${locale}/quizzes/${safeQuizId}/play`);
  };

  const retake = () => {
    useQuizPlayerStore.getState().resetAll();
    goToQuiz();
  };

  const catalogEnabled =
    hasStoreResult && Number.isFinite(quizId) && quizId > 0;

  const catalogQuery = useQuery({
    queryKey: ['results', 'catalog', quizId, locale],
    enabled: catalogEnabled,
    queryFn: () => fetchCatalog(locale, quizId),
    staleTime: 60_000,
    retry: 1,
  });

  const traitByCode = useMemo(() => {
    const m = new Map<string, TraitDto>();
    for (const tr of catalogQuery.data?.traits ?? []) {
      const code = (tr.code ?? '').trim();
      if (code) m.set(code, tr);
    }
    return m;
  }, [catalogQuery.data?.traits]);

  const professionById = useMemo(() => {
    const m = new Map<number, ProfessionDto>();
    for (const p of catalogQuery.data?.professions ?? []) {
      if (typeof p.id === 'number' && Number.isFinite(p.id)) m.set(p.id, p);
    }
    return m;
  }, [catalogQuery.data?.professions]);

  if (!attemptIdReady) {
    return (
      <div style={{ padding: 24, maxWidth: 720 }}>
        <h1>{t('Results.title')}</h1>
        <p style={{ opacity: 0.7 }}>{t('Results.loading')}</p>
      </div>
    );
  }

  if (!attemptIdValid) {
    return (
      <div style={{ padding: 24, maxWidth: 720 }}>
        <h1>{t('Results.title')}</h1>
        <p>{t('Results.invalidAttemptId')}</p>
        <button onClick={goToQuiz}>{t('Results.goToQuiz')}</button>
      </div>
    );
  }

  if (!hasStoreResult) {
    return (
      <div style={{ padding: 24, maxWidth: 720 }}>
        <h1>{t('Results.title')}</h1>
        <p>{t('Results.noSessionResult')}</p>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button onClick={goToQuiz}>{t('Results.goToQuiz')}</button>
          <button onClick={retake}>{t('Results.retake')}</button>
        </div>
      </div>
    );
  }

  const result = storedResult as AttemptResult;

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>{t('Results.title')}</h1>
        <span style={{ opacity: 0.7 }}>
          {t('Results.attempt', { id: attemptIdFromUrl })}
        </span>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={retake}>{t('Results.retake')}</button>
        <button onClick={goToQuiz}>{t('Results.backToQuiz')}</button>
      </div>

      {catalogQuery.isLoading && (
        <p style={{ marginTop: 16, opacity: 0.7 }}>
          {t('Results.catalogLoading')}
        </p>
      )}

      {catalogQuery.isError && (
        <p style={{ marginTop: 16, color: 'crimson' }}>
          {catalogQuery.error instanceof Error
            ? catalogQuery.error.message
            : t('Results.catalogError')}
        </p>
      )}

      <section style={{ marginTop: 24 }}>
        <h2>{t('Results.traitsTitle')}</h2>
        <ul>
          {result.traitScores.map((ts) => {
            const tr = traitByCode.get(ts.traitCode);
            return (
              <li key={ts.traitCode}>
                <strong>{tr?.name?.trim() || ts.traitCode}</strong>: {ts.score}
                {tr?.description && (
                  <div style={{ opacity: 0.75 }}>{tr.description}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>{t('Results.recommendedTitle')}</h2>
        <ol>
          {result.recommendations.map((rec) => {
            const prof = professionById.get(rec.professionId) ?? null;
            const title = safeProfessionTitle(rec, prof, t);

            return (
              <li key={rec.professionId}>
                <strong>{title}</strong>
                <div>
                  {t('Results.matchScore', {
                    score: (rec.score * 100).toFixed(1),
                  })}
                </div>
                {prof?.description && (
                  <div style={{ opacity: 0.75 }}>{prof.description}</div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {catalogQuery.isFetching && (
        <p style={{ marginTop: 16, opacity: 0.6 }}>{t('Results.updating')}</p>
      )}
    </div>
  );
}
