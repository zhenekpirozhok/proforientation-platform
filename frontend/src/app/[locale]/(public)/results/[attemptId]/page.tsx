"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useQuizPlayerStore } from "@/features/quiz-player/model/store";

const TRAIT_LABELS: Record<string, string> = {
  A: "Analytical Thinking",
  C: "Creativity",
  E: "Emotional Intelligence",
  I: "Focus & Independence",
  R: "Rational Decision-Making",
  S: "Social Skills",
};

export default function ResultPage() {
  const params = useParams<{ attemptId: string }>();
  const locale = useLocale();
  const router = useRouter();

  const attemptIdFromUrl = Number(params.attemptId);

  const result = useQuizPlayerStore((s) => s.result);
  const storedAttemptId = useQuizPlayerStore((s) => s.attemptId);
  const quizId = useQuizPlayerStore((s) => s.quizId);

  const canShowResult = useMemo(() => {
    return Number.isFinite(attemptIdFromUrl) && storedAttemptId === attemptIdFromUrl && !!result;
  }, [attemptIdFromUrl, storedAttemptId, result]);

  const goToQuiz = () => {
    // если quizId неизвестен — падаем на 1 (как у тебя было), но лучше потом убрать это
    const safeQuizId = Number.isFinite(quizId) && quizId > 0 ? quizId : 1;
    router.push(`/${locale}/quizzes/${safeQuizId}/play`);
  };

  const retake = () => {
    // ✅ очищаем persisted state, чтобы стартанул новый attempt
    useQuizPlayerStore.getState().resetAll();
    goToQuiz();
  };

  if (!Number.isFinite(attemptIdFromUrl)) {
    return (
      <div style={{ padding: 24, maxWidth: 720 }}>
        <h1>Test Results</h1>
        <p>Invalid attempt id.</p>
        <button onClick={goToQuiz}>Go to quiz</button>
      </div>
    );
  }

  if (!canShowResult) {
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

      {/* Traits */}
      <section style={{ marginTop: 24 }}>
        <h2>Your Traits</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {result!.traitScores.map((trait) => (
            <li key={trait.traitCode}>
              <strong>{TRAIT_LABELS[trait.traitCode] ?? trait.traitCode}</strong>: {trait.score}
            </li>
          ))}
        </ul>
      </section>

      {/* Recommendations */}
      <section style={{ marginTop: 24 }}>
        <h2>Recommended Fields</h2>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {result!.recommendations.map((rec) => (
            <li key={rec.professionId} style={{ marginBottom: 10 }}>
              <div>
                <strong>
                  {(rec.explanation ?? "").replace("Predicted as: ", "") || `Profession #${rec.professionId}`}
                </strong>
              </div>
              <div style={{ opacity: 0.8 }}>
                Match score: {(rec.score * 100).toFixed(1)}%
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
