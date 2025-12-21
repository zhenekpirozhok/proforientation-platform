"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useStartAttemptMutation } from "@/entities/attempt/api/useStartAttemptMutation";
import { useSubmitAttemptMutation } from "@/entities/attempt/api/useSubmitAttemptMutation";
import { useQuizPlayerStore } from "../model/store";
import { useCurrentQuizVersionIdQuery } from "../model/useCurrentQuizVersionIdQuery";

type Props = {
  quizId: number;
};

export function QuizPlayer({ quizId }: Props) {
  const router = useRouter();

  const {
    attemptId,
    guestToken,
    status,
    error,
    start,
    setAttempt,
    setStatus,
    setError,
  } = useQuizPlayerStore();

  const versionQuery = useCurrentQuizVersionIdQuery(quizId);
  const startAttempt = useStartAttemptMutation();
  const submitAttempt = useSubmitAttemptMutation();

  useEffect(() => {
    const quizVersionId = versionQuery.data;
    if (quizVersionId === undefined) return;

    let cancelled = false;

    async function startFlow(versionId: number) {
      try {
        start(quizId);

        const started = await startAttempt.mutateAsync({
          quizVersionId: versionId,
        });

        if (cancelled) return;
        setAttempt(started.attemptId, started.guestToken);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to start attempt");
      }
    }

    startFlow(quizVersionId);

    return () => {
      cancelled = true;
    };
  }, [quizId, versionQuery.data]);

  async function onSubmit() {
    if (!attemptId || !guestToken) return;

    try {
      setStatus("submitting");
      await submitAttempt.mutateAsync({ attemptId, guestToken });
      setStatus("finished");
      router.push(`/results/${attemptId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit attempt");
    }
  }

  if (versionQuery.isLoading || status === "starting") {
    return <p>Подготовка теста…</p>;
  }

  if (versionQuery.isError) {
    return <p>Ошибка версии теста: {versionQuery.error?.message}</p>;
  }

  if (status === "error") {
    return <p>Ошибка: {error}</p>;
  }

  if (!attemptId || !guestToken) {
    return <p>Инициализация попытки…</p>;
  }

  return (
    <div>
      <h1>Прохождение теста</h1>
      <p>Attempt #{attemptId}</p>

      {/* TODO: здесь будет UI вопросов + отправка answers с guestToken */}

      <button onClick={onSubmit} disabled={status === "submitting"}>
        Завершить тест
      </button>
    </div>
  );
}
