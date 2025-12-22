"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAttemptResultQuery } from "@/entities/attempt/api/useAttemptResultQuery";
import { useQuizPlayerStore } from "@/features/quiz-player/model/store";

export default function ResultPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = Number(params.attemptId);
  const locale = useLocale();

  const guestToken = useQuizPlayerStore((s) => s.guestToken);

  const { data, isLoading, error } = useAttemptResultQuery(
    attemptId,
    guestToken ?? undefined,
    locale
  );

  if (!Number.isFinite(attemptId)) return <p>Некорректная попытка</p>;

  if (!guestToken) {
    return <p>Нет гостевого токена — начните квиз заново.</p>;
  }

  if (isLoading) return <p>Загрузка результата…</p>;
  if (error) return <p>Ошибка загрузки результата</p>;

  return (
    <div>
      <h1>Результат теста</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
