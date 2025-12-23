"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { useQuizPlayerStore } from "@/features/quiz-player/model/store";
import type { AttemptResult } from "@/features/quiz-player/model/types";
import { parseResponse } from "@/shared/api/parseResponse";

type TraitDto = { id?: number; code?: string; name?: string; description?: string };
type ProfessionDto = { id?: number; name?: string; description?: string; categoryId?: number };

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
  prof: ProfessionDto | null
) {
  const apiName = prof?.name?.trim();
  if (apiName) return apiName;

  const fromExplanation = (rec.explanation ?? "").replace("Predicted as: ", "").trim();
  if (fromExplanation) return fromExplanation;

  return `Profession #${rec.professionId}`;
}

export default function ResultPage() {
  const params = useParams<{ attemptId?: string }>();
  const attemptIdStr = params?.attemptId;

  const locale = useLocale();
  const router = useRouter();

  const quizId = useQuizPlayerStore((s) => s.quizId);
  const storedAttemptId = useQuizPlayerStore((s) => s.attemptId);
  const storedResult = useQuizPlayerStore((s) => s.result);

  const goToQuiz = () => {
    const safeQuizId = Number.isFinite(quizId) && quizId > 0 ? quizId : 1;
    router.push(`/${locale}/quizzes/${safeQuizId}/play`);
  };

  const retake = () => {
    useQuizPlayerStore.getState().resetAll();
    goToQuiz();
  };

  // --- вычисления (без ранних return до хуков) ---
  const attemptIdFromUrl = attemptIdStr ? Number(attemptIdStr) : NaN;
  const attemptIdReady = Boolean(attemptIdStr);
  const attemptIdValid = Number.isFinite(attemptIdFromUrl);

  const hasStoreResult =
    attemptIdValid && !!storedResult && storedAttemptId === attemptIdFromUrl;

  // useQuery должен вызываться ВСЕГДА
  const catalogEnabled =
    hasStoreResult && Number.isFinite(quizId) && quizId > 0;

  const catalogQuery = useQuery({
    queryKey: ["results", "catalog", "quizId", quizId, "locale", locale],
    enabled: catalogEnabled,
    queryFn: () => fetchCatalog(locale, quizId),
    staleTime: 60_000,
    retry: 1,
  });

  const traitByCode = useMemo(() => {
    const m = new Map<string, TraitDto>();
    for (const t of catalogQuery.data?.traits ?? []) {
      const code = (t.code ?? "").trim();
      if (code) m.set(code, t);
    }
    return m;
  }, [catalogQuery.data?.traits]);

  const professionById = useMemo(() => {
    const m = new Map<number, ProfessionDto>();
    for (const p of catalogQuery.data?.professions ?? []) {
      if (typeof p.id === "number") m.set(p.id, p);
    }
    return m;
  }, [catalogQuery.data?.professions]);

  // --- теперь можно делать return-ы ---
  if (!attemptIdReady) {
    return (
      <div style={{ padding: 24, maxWidth: 720 }}>
        <h1>Test Results</h1>
        <p style={{ opacity: 0.7 }}>Loading…</p>
      </div>
    );
  }

  if (!attemptIdValid) {
    return (
      <div style={{ padding: 24, maxWidth: 720 }}>
        <h1>Test Results</h1>
        <p>Invalid attempt id.</p>
        <button onClick={goToQuiz}>Go to quiz</button>
      </div>
    );
  }

  if (!hasStoreResult) {
    return (
      <div style={{ padding: 24, maxWidth: 720 }}>
        <h1>Test Results</h1>
        <p>Result is not available in this session.</p>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button onClick={goToQuiz}>Go to quiz</button>
          <button onClick={retake}>Retake quiz</button>
        </div>
      </div>
    );
  }

  const result = storedResult as AttemptResult;

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>Test Results</h1>
        <span style={{ opacity: 0.7, fontSize: 14 }}>Attempt #{attemptIdFromUrl}</span>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button onClick={retake}>Retake quiz</button>
        <button onClick={goToQuiz}>Back to quiz</button>
      </div>

      {catalogQuery.isLoading ? (
        <p style={{ marginTop: 16, opacity: 0.7 }}>Loading trait/profession catalog…</p>
      ) : null}

      {catalogQuery.isError ? (
        <p style={{ marginTop: 16, color: "crimson" }}>
          {catalogQuery.error instanceof Error
            ? catalogQuery.error.message
            : "Failed to load catalog"}
        </p>
      ) : null}

      {/* Traits */}
      <section style={{ marginTop: 24 }}>
        <h2>Your Traits</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {result.traitScores.map((ts) => {
            const tr = traitByCode.get(ts.traitCode) ?? null;
            return (
              <li key={ts.traitCode} style={{ marginBottom: 10 }}>
                <div>
                  <strong>{tr?.name?.trim() || ts.traitCode}</strong>: {ts.score}
                </div>
                {tr?.description ? (
                  <div style={{ opacity: 0.75, marginTop: 4 }}>{tr.description}</div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Recommendations */}
      <section style={{ marginTop: 24 }}>
        <h2>Recommended Fields</h2>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {result.recommendations.map((rec) => {
            const prof = professionById.get(rec.professionId) ?? null;
            const title = safeProfessionTitle(rec, prof);

            return (
              <li key={rec.professionId} style={{ marginBottom: 12 }}>
                <div>
                  <strong>{title}</strong>
                  {catalogQuery.data && prof == null ? (
                    <span style={{ marginLeft: 8, opacity: 0.7, fontSize: 12 }}>
                      (not in this category)
                    </span>
                  ) : null}
                </div>

                <div style={{ opacity: 0.8 }}>Match score: {(rec.score * 100).toFixed(1)}%</div>

                {prof?.description ? (
                  <div style={{ opacity: 0.75, marginTop: 4 }}>{prof.description}</div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      {catalogQuery.isFetching ? <p style={{ marginTop: 16, opacity: 0.6 }}>Updating…</p> : null}
    </div>
  );
}
