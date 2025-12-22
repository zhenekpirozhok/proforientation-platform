"use client";

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
  const attemptId = Number(params.attemptId);
  const locale = useLocale();
  const router = useRouter();

  const result = useQuizPlayerStore((s) => s.result);
  const storedAttemptId = useQuizPlayerStore((s) => s.attemptId);

  if (!Number.isFinite(attemptId)) {
    return <p>Invalid attempt.</p>;
  }

  if (!result || storedAttemptId !== attemptId) {
    return (
      <div>
        <p>Result is not available in this session.</p>
        <button onClick={() => router.push(`/${locale}/quizzes/1/play`)}>
          Go to quiz
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1>Test Results</h1>

      {/* Traits */}
      <section>
        <h2>Your Traits</h2>
        <ul>
          {result.traitScores.map((trait) => (
            <li key={trait.traitCode}>
              <strong>
                {TRAIT_LABELS[trait.traitCode] ?? trait.traitCode}
              </strong>
              : {trait.score}
            </li>
          ))}
        </ul>
      </section>

      {/* Recommendations */}
      <section style={{ marginTop: 24 }}>
        <h2>Recommended Fields</h2>
        <ol>
          {result.recommendations.map((rec) => (
            <li key={rec.professionId}>
              <div>
                <strong>{rec.explanation?.replace("Predicted as: ", "")}</strong>
              </div>
              <div>Match score: {(rec.score * 100).toFixed(1)}%</div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
