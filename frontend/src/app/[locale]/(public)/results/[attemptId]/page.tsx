"use client";

import "@/features/results/ui/results.css";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/shared/i18n/lib/navigation";
import { useLocale, useTranslations, type _Translator } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "antd";

import { useQuizPlayerStore } from "@/features/quiz-player/model/store";
import type { AttemptResult } from "@/features/quiz-player/model/types";
import { parseResponse } from "@/shared/api/parseResponse";

import { ResultsHero } from "@/features/results/ui/ResultHero";
import { TraitsSliders } from "@/features/results/ui/TraitsSliders";
import { CareerMatches } from "@/features/results/ui/CareerMatches";
import { ResultsActions } from "@/features/results/ui/ResultsActions";
import { ResultsSkeleton } from "@/features/results/ui/ResultsSkeleton";

type TraitDto = {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
};

type ProfessionDto = {
  id?: number;
  title?: string;
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
    method: "GET",
    headers: { "x-locale": locale },
    cache: "no-store",
  });
  return parseResponse<CatalogDto>(res);
}

function safeProfessionTitle(
  rec: { professionId: number; explanation?: string },
  prof: ProfessionDto | null,
  t: _Translator,
) {
  const apiTitle = prof?.title?.trim();
  if (apiTitle) return apiTitle;

  const fromExplanation = (rec.explanation ?? "")
    .replace("Predicted as: ", "")
    .trim();
  if (fromExplanation) return fromExplanation;

  return t("Results.fallbackProfessionTitle", { id: rec.professionId });
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
  if (!top) return t("Results.heroFallbackType");
  return traitByCode.get(top.traitCode)?.name?.trim() || top.traitCode;
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
    router.push(`/quizzes/${safeQuizId}/play`);
  };

  const retake = () => {
    useQuizPlayerStore.getState().resetAll();
    goToQuiz();
  };

  const catalogEnabled = hasStoreResult && Number.isFinite(quizId) && quizId > 0;

  const catalogQuery = useQuery({
    queryKey: ["results", "catalog", quizId, locale],
    enabled: catalogEnabled,
    queryFn: () => fetchCatalog(locale, quizId),
    staleTime: 60_000,
    retry: 1,
  });

  const traitByCode = useMemo(() => {
    const m = new Map<string, TraitDto>();
    for (const tr of catalogQuery.data?.traits ?? []) {
      const code = (tr.code ?? "").trim();
      if (code) m.set(code, tr);
    }
    return m;
  }, [catalogQuery.data?.traits]);

  const professionById = useMemo(() => {
    const m = new Map<number, ProfessionDto>();
    for (const p of catalogQuery.data?.professions ?? []) {
      if (typeof p.id === "number" && Number.isFinite(p.id)) m.set(p.id, p);
    }
    return m;
  }, [catalogQuery.data?.professions]);

  if (!attemptIdReady) {
    return (
      <div className="cp-results-content">
        <ResultsSkeleton />
      </div>
    );
  }

  if (!attemptIdValid) {
    return (
      <div className="cp-results-content">
        <Alert type="error" showIcon message={t("Results.invalidAttemptId")} />
        <div style={{ marginTop: 16 }}>
          <ResultsActions
            primaryLabel={t("Results.goToQuiz")}
            secondaryLabel={t("Results.retake")}
            onPrimary={goToQuiz}
            onSecondary={retake}
          />
        </div>
      </div>
    );
  }

  if (!hasStoreResult) {
    return (
      <div className="cp-results-content">
        <Alert type="warning" showIcon message={t("Results.noSessionResult")} />
        <div style={{ marginTop: 16 }}>
          <ResultsActions
            primaryLabel={t("Results.goToQuiz")}
            secondaryLabel={t("Results.retake")}
            onPrimary={goToQuiz}
            onSecondary={retake}
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

  return (
    <div className="cp-results">
      <ResultsHero
        title={t("Results.completeTitle")}
        subtitleTitle={t("Results.heroTypeTitle", { type: heroType })}
        subtitleText={t("Results.heroTypeSubtitle")}
      />

      <div className="cp-results-content">
        {catalogQuery.isError ? (
          <Alert
            type="warning"
            showIcon
            message={
              catalogQuery.error instanceof Error
                ? catalogQuery.error.message
                : t("Results.catalogError")
            }
            style={{ marginBottom: 16 }}
          />
        ) : null}

        {catalogQuery.isLoading ? (
          <ResultsSkeleton />
        ) : (
          <>
            <TraitsSliders title={t("Results.traitsTitle")} rows={traitRows} />

            <CareerMatches
              title={t("Results.topMatchesTitle")}
              subtitle={t("Results.topMatchesSubtitle")}
              rows={matchRows.slice(0, 3)}
              matchLabel={t("Results.match")}
            />

            <ResultsActions
              primaryLabel={t("Results.save")}
              secondaryLabel={t("Results.takeAnother")}
              onPrimary={() => {}}
              onSecondary={retake}
            />
          </>
        )}
      </div>
    </div>
  );
}
