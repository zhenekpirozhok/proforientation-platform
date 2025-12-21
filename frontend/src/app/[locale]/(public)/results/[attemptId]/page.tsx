"use client";

import { useParams } from "next/navigation";
import { useAttemptResultQuery } from "@/entities/attempt/api/useAttemptResultQuery";

export default function ResultPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = Number(params.attemptId);

  const { data, isLoading, error } = useAttemptResultQuery(attemptId);

  if (!Number.isFinite(attemptId)) return <p>Некорректная попытка</p>;
  if (isLoading) return <p>Загрузка результата…</p>;
  if (error) return <p>Ошибка загрузки результата</p>;

  return (
    <div>
      <h1>Результат теста</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
