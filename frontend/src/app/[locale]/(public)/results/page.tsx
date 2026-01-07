'use client';

import '@/features/results/ui/results.css';

import { useMemo } from 'react';
import { useRouter } from '@/shared/i18n/lib/navigation';
import { useTranslations, type _Translator } from 'next-intl';
import { Alert } from 'antd';

import { useQuizPlayerStore } from '@/features/quiz-player/model/store';
import type { AttemptResult } from '@/features/quiz-player/model/types';
import { useQuizCatalogForResults } from '@/features/results/model/useQuizCatalogForResults';
import { useSessionStore } from '@/entities/session/model/store';

import { ResultsHero } from '@/features/results/ui/ResultHero';
import { TraitsSliders } from '@/features/results/ui/TraitsSliders';
import { CareerMatches } from '@/features/results/ui/CareerMatches';
import { ResultsActions } from '@/features/results/ui/ResultsActions';
import { ResultsSkeleton } from '@/features/results/ui/ResultsSkeleton';

import type { TraitDto, ProfessionDto } from '@/shared/api/generated/model';

function safeProfessionTitle(
  rec: { professionId: number; explanation?: string },
  prof: ProfessionDto | null,
  t: _Translator,
) {
  const apiTitle = prof?.title?.trim();
  if (apiTitle) return apiTitle;

  const fromExplanation = (rec.explanation ?? '')
    .replace('Predicted as: ', '')
    .trim();
  if (fromExplanation) return fromExplanation;

  return t('Results.fallbackProfessionTitle', { id: rec.professionId });
}

function topTraitName(
  result: AttemptResult,
  traitByCode: Map<string, TraitDto>,
  t: _Translator,
) {
  const sorted = (result.traitScores ?? [])
    .slice()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top = sorted[0];
  if (!top) return t('Results.heroFallbackType');
  return traitByCode.get(top.traitCode)?.name?.trim() || top.traitCode;
}

export default function ResultPage() {
  const t = useTranslations();
  const router = useRouter();

  const quizId = useQuizPlayerStore((s) => s.quizId);
  const storedResult = useQuizPlayerStore((s) => s.result);

  const status = useSessionStore((s) => s.status);
  const isAuthenticated = status === 'auth';

  const goToQuiz = () => {
    const safeQuizId = Number.isFinite(quizId) && quizId > 0 ? quizId : 1;
    router.push(`/quizzes/${safeQuizId}/play`);
  };

  const retake = () => {
    useQuizPlayerStore.getState().resetAll();
    goToQuiz();
  };

  const catalogEnabled =
    Boolean(storedResult) && Number.isFinite(quizId) && quizId > 0;
  const catalogQ = useQuizCatalogForResults(catalogEnabled ? quizId : 0);

  const traitByCode = useMemo(() => {
    const traits: TraitDto[] = catalogQ.data?.traits ?? [];
    const m = new Map<string, TraitDto>();
    for (const tr of traits) {
      const code = (tr.code ?? '').trim();
      if (code) m.set(code, tr);
    }
    return m;
  }, [catalogQ.data]);

  const professionById = useMemo(() => {
    const professions: ProfessionDto[] = catalogQ.data?.professions ?? [];
    const m = new Map<number, ProfessionDto>();
    for (const p of professions) {
      if (typeof p.id === 'number' && Number.isFinite(p.id)) m.set(p.id, p);
    }
    return m;
  }, [catalogQ.data]);

  if (!storedResult) {
    return (
      <div className="cp-results-content">
        <Alert type="warning" showIcon title={t('Results.noSessionResult')} />
        <div style={{ marginTop: 16 }}>
          <ResultsActions
            primaryLabel={t('Results.goToQuiz')}
            secondaryLabel={t('Results.retake')}
            onPrimary={goToQuiz}
            onSecondary={retake}
            isAuthenticated={isAuthenticated}
            loginTitle={t('Results.loginTitle')}
            loginBody={t('Results.loginBody')}
            loginOkText={t('Results.loginOkText')}
            loginCancelText={t('Results.loginCancelText')}
          />
        </div>
      </div>
    );
  }

  const result = storedResult as AttemptResult;

  const traitRows =
    result.traitScores?.map((ts) => {
      const tr = traitByCode.get(ts.traitCode);
      return {
        key: ts.traitCode,
        label: tr?.name?.trim() || ts.traitCode,
        description: tr?.description,
        value: ts.score,
      };
    }) ?? [];

  const matchRows =
    result.recommendations?.map((rec) => {
      const prof = professionById.get(rec.professionId) ?? null;
      return {
        id: rec.professionId,
        title: safeProfessionTitle(rec, prof, t),
        description: prof?.description,
        score01: rec.score,
      };
    }) ?? [];

  const heroType = topTraitName(result, traitByCode, t);

  const primaryLabel = !isAuthenticated
    ? t('Results.save')
    : t('Results.goToQuiz');
  const onPrimary = isAuthenticated ? () => {} : goToQuiz;

  const showSkeleton = catalogEnabled && catalogQ.isLoading;

  return (
    <div className="cp-results">
      <ResultsHero
        title={t('Results.completeTitle')}
        subtitleTitle={t('Results.heroTypeTitle', { type: heroType })}
        subtitleText={t('Results.heroTypeSubtitle')}
      />

      <div className="cp-results-content">
        {catalogEnabled && catalogQ.isError ? (
          <Alert
            type="warning"
            showIcon
            title={
              catalogQ.error instanceof Error
                ? catalogQ.error.message
                : t('Results.catalogError')
            }
            style={{ marginBottom: 16 }}
          />
        ) : null}

        {showSkeleton ? (
          <ResultsSkeleton />
        ) : (
          <>
            <TraitsSliders title={t('Results.traitsTitle')} rows={traitRows} />

            <CareerMatches
              title={t('Results.topMatchesTitle')}
              subtitle={t('Results.topMatchesSubtitle')}
              rows={matchRows.slice(0, 3)}
              matchLabel={t('Results.match')}
            />

            <ResultsActions
              primaryLabel={primaryLabel}
              secondaryLabel={t('Results.takeAnother')}
              onPrimary={onPrimary}
              onSecondary={retake}
              isAuthenticated={isAuthenticated}
              loginTitle={t('Results.loginTitle')}
              loginBody={t('Results.loginBody')}
              loginOkText={t('Results.loginOkText')}
              loginCancelText={t('Results.loginCancelText')}
            />
          </>
        )}
      </div>
    </div>
  );
}
