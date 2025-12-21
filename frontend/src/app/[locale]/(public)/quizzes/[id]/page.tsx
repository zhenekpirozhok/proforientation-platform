"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuizDetails } from "@/entities/quiz/api/useQuizDetails";

export default function QuizDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);

  const t = useTranslations("QuizDetails");

  const { data, isLoading, error } = useQuizDetails(quizId); 

  if (!Number.isFinite(quizId)) return <div>Invalid quiz id</div>;
  if (isLoading) return <div>{t("loading")}</div>;
  if (error || !data) return <div>{t("error")}</div>;

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>{data.title ?? t("fallbackTitle", { id: quizId })}</h1>

      <section style={{ marginTop: 24 }}>
        <div>
          {t("questions")}: <strong>{data.questionCount}</strong>
        </div>

        <div style={{ marginTop: 8 }}>
          {t("duration")}:{" "}
          <strong>{t("minutes", { count: data.estimatedMinutes })}</strong>
        </div>
      </section>

      <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
        <Link href={`/quizzes/${quizId}/start`}>{t("start")}</Link>
        <Link href="/quizzes">{t("back")}</Link>
      </div>
    </main>
  );
}
