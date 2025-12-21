"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuizzes } from "@/entities/quiz/api/useQuizzes";

export default function QuizzesPage() {
  const t = useTranslations("Quizzes");
  const { data, isLoading, error } = useQuizzes({ page: 1, size: 20 });

  if (isLoading) return <div>{t("loading")}</div>;
  if (error) return <div>{t("error")}</div>;

  const items = Array.isArray(data)
    ? data
    : (data as any)?.content ?? (data as any)?.items ?? [];

  return (
    <div style={{ padding: 24 }}>
      <h1>{t("title")}</h1>

      <ul>
        {items.map((q: any) => (
          <li key={q.id}>
            <Link href={`/quizzes/${q.id}`}>
              {q.title ?? q.name ?? t("fallbackTitle", { id: q.id })}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
