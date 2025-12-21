"use client";

import { useParams } from "next/navigation";
import { useCurrentQuizVersion } from "@/entities/quiz/api/useCurrentQuizVersion";

export default function QuizStartPage() {
  const params = useParams();
  const quizId = Number(params.id);

  const { data, isLoading, error } = useCurrentQuizVersion(quizId);

  if (isLoading) return <div>Loading quiz…</div>;
  if (error || !data) return <div>Failed to load quiz</div>;

  // предполагаем стандартную структуру
  const firstQuestion = data.questions?.[0];

  if (!firstQuestion) {
    return <div>No questions in this quiz</div>;
  }

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>{data.title}</h1>

      <section style={{ marginTop: 32 }}>
        <h2>
          Question 1 / {data.questions.length}
        </h2>

        <p style={{ fontSize: 18, marginTop: 16 }}>
          {firstQuestion.text}
        </p>

        <ul style={{ marginTop: 16 }}>
          {firstQuestion.options?.map((option) => (
            <li key={option.id}>
              <label>
                <input type="radio" disabled /> {option.text}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <button
        disabled
        style={{ marginTop: 32, opacity: 0.5 }}
      >
        Next
      </button>
    </main>
  );
}
