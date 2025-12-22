"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";

import { useStartAttemptMutation } from "@/entities/attempt/api/useStartAttemptMutation";
import { useSendAnswersBulkMutation } from "@/entities/attempt/api/useSendAnswersBulkMutation";
import { useSubmitAttemptMutation } from "@/entities/attempt/api/useSubmitAttemptMutation";

import { useCurrentQuizVersionIdQuery } from "../model/useCurrentQuizVersionIdQuery";
import { useQuizPlayerStore } from "../model/store";

import type { Question, PageLike } from "@/entities/question/model/types";
import { parseResponse } from "@/shared/api/parseResponse";

type Props = { quizId: number };

function safeErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Unknown error";
}

const BATCH_SIZE = 10;

function batchIndexFromQuestionIndex(questionIndex0: number) {
  return Math.floor(questionIndex0 / BATCH_SIZE);
}

function indexInBatch(questionIndex0: number) {
  return questionIndex0 % BATCH_SIZE;
}

const quizQuestionBatchKey = (quizId: number, batch: number, locale: string) =>
  ["questions", "quiz", quizId, "batch", batch, "size", BATCH_SIZE, "locale", locale] as const;

async function fetchQuestionBatch(params: {
  quizId: number;
  batch: number; // 0-based batch index
  locale: string;
  signal?: AbortSignal;
}) {
  const { quizId, batch, locale, signal } = params;

  const sp = new URLSearchParams({ page: String(batch), size: String(BATCH_SIZE) });

  const res = await fetch(`/api/questions/quiz/${quizId}?${sp.toString()}`, {
    method: "GET",
    headers: { "x-locale": locale },
    signal,
  });

  const data = await parseResponse<PageLike<Question> | Question[]>(res);

  if (Array.isArray(data)) {
    return { questions: data, total: data.length, last: true };
  }

  return {
    questions: Array.isArray(data.content) ? data.content : [],
    total: typeof data.totalElements === "number" ? data.totalElements : undefined,
    last: data.last === true,
  };
}

export function QuizPlayer({ quizId }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const locale = useLocale();
  const t = useTranslations("QuizPlayer");

  const {
    attemptId,
    guestToken,
    status,
    error,
    currentIndex,
    totalQuestions,
    answersByQuestionId,
    quizVersionId,
    resumeOrStart,
    setAttempt,
    setStatus,
    setError,
    setTotalQuestions,
    goNext,
    goPrev,
    selectOption,
    setIndex,
    resetAll,
  } = useQuizPlayerStore();

  const versionQuery = useCurrentQuizVersionIdQuery(quizId);

  const startAttempt = useStartAttemptMutation();
  const sendBulk = useSendAnswersBulkMutation();
  const submitAttempt = useSubmitAttemptMutation();

  const startedForRef = useRef<number | null>(null);

  useEffect(() => {
    const vId = versionQuery.data;
    if (!vId) return;

    if (startedForRef.current === vId) return;
    startedForRef.current = vId;

    resumeOrStart(quizId, vId);

    const s = useQuizPlayerStore.getState();
    if (s.attemptId && s.guestToken) return;

    let cancelled = false;

    (async () => {
      try {
        const started = await startAttempt.mutateAsync({ quizVersionId: vId, locale });
        if (cancelled) return;
        setAttempt(started.attemptId, started.guestToken);
      } catch (e) {
        if (cancelled) return;
        setError(safeErrorMessage(e));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, versionQuery.data, locale]);

  const hasTotal = totalQuestions != null;
  const isLast = hasTotal ? currentIndex === (totalQuestions ?? 1) - 1 : false;

  const canPrev = currentIndex > 0;
  const canNext = !hasTotal || !isLast;
  const canSubmit = hasTotal && isLast;

  // bulk-only: нет "saving"
  const isBusy = status === "submitting" || status === "finished";

  const batch = batchIndexFromQuestionIndex(currentIndex);

  const batchQuery = useQuery({
    queryKey: quizQuestionBatchKey(quizId, batch, locale),
    enabled: Number.isFinite(quizId) && quizId > 0 && batch >= 0 && Boolean(locale),
    queryFn: ({ signal }) => fetchQuestionBatch({ quizId, batch, locale, signal }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const total = batchQuery.data?.total;
    if (typeof total === "number") setTotalQuestions(total);
  }, [batchQuery.data?.total, setTotalQuestions]);

  const question: Question | null = useMemo(() => {
    const qs = batchQuery.data?.questions ?? [];
    return qs[indexInBatch(currentIndex)] ?? null;
  }, [batchQuery.data?.questions, currentIndex]);

  const selectedOptionId = useMemo(() => {
    if (!question?.id) return undefined;
    return answersByQuestionId[question.id];
  }, [answersByQuestionId, question?.id]);

  useEffect(() => {
    if (!question) return;

    const nextIndex = currentIndex + 1;
    if (hasTotal && totalQuestions != null && nextIndex >= totalQuestions) return;

    const nextBatch = batchIndexFromQuestionIndex(nextIndex);
    if (nextBatch === batch) return;

    const key = quizQuestionBatchKey(quizId, nextBatch, locale);
    if (qc.getQueryData(key)) return;

    qc.prefetchQuery({
      queryKey: key,
      queryFn: ({ signal }) => fetchQuestionBatch({ quizId, batch: nextBatch, locale, signal }),
      staleTime: 30_000,
    }).catch(() => {});
  }, [question?.id, currentIndex, batch, hasTotal, totalQuestions, quizId, locale, qc]);

  // ✅ bulk-only: просто идём дальше, ответ уже в zustand
  async function onNext() {
    if (isBusy) return;
    if (!question || !selectedOptionId) return;
    goNext();
  }

  async function onSubmit() {
    if (isBusy) return;
    if (!attemptId || !guestToken || !hasTotal) return;
    if (!question || !selectedOptionId) return;

    try {
      const s = useQuizPlayerStore.getState();

      // ответы из стора
      const optionIdsRaw = Object.values(s.answersByQuestionId);

      // защита от дублей (иначе uq_answers_attempt_option)
      const optionIds = Array.from(new Set(optionIdsRaw));

      if (optionIds.length !== s.totalQuestions) {
        throw new Error(`Need exactly ${s.totalQuestions} distinct answers, got ${optionIds.length}`);
      }

      setStatus("submitting");

      await sendBulk.mutateAsync({
        attemptId,
        guestToken,
        optionIds,
        locale,
      });

      await submitAttempt.mutateAsync({ attemptId, guestToken, locale });

      setStatus("finished");

      // не сбрасываем store тут — ResultPage читает guestToken из него
      router.push(`/${locale}/results/${attemptId}`);

    } catch (e) {
      setStatus("in-progress");
      setError(safeErrorMessage(e));
    }
  }

  if (versionQuery.isLoading || status === "starting") return <p>{t("loading")}</p>;

  if (versionQuery.isError) {
    return <p>{t("errorVersion", { message: versionQuery.error?.message ?? "" })}</p>;
  }

  if (status === "error") {
    return <p>{t("errorGeneric", { message: error ?? "" })}</p>;
  }

  if (!attemptId || !guestToken || !quizVersionId) return <p>{t("noToken")}</p>;

  if (batchQuery.isError) {
    return <p>{t("errorQuestion", { message: safeErrorMessage(batchQuery.error) })}</p>;
  }

  if (!question) {
    const isReallyFinished = hasTotal && totalQuestions != null && currentIndex >= totalQuestions;

    if (isReallyFinished) {
      return (
        <div style={{ maxWidth: 900 }}>
          <h1>{t("title")}</h1>
          <p>{t("finishedQuestions")}</p>
          <button onClick={() => router.push(`/${locale}/results/${attemptId}`)}>
            {t("toResults")}
          </button>
        </div>
      );
    }

    return <p>{t("loadingQuestion")}</p>;
  }

  const nextDisabled = !canNext || !selectedOptionId || isBusy;

  const submitDisabled =
    !canSubmit ||
    !selectedOptionId ||
    submitAttempt.isPending ||
    sendBulk.isPending ||
    isBusy;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>{t("title")}</h1>

      <p>
        {t("attempt", { id: attemptId })} •{" "}
        {hasTotal
          ? t("questionProgress", { current: currentIndex + 1, total: totalQuestions })
          : t("questionProgressShort", { current: currentIndex + 1 })}
      </p>

      {batchQuery.isFetching && <p style={{ marginTop: 8, opacity: 0.6 }}>{t("loadingQuestion")}</p>}

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ccc" }}>
        <h2 style={{ margin: 0 }}>
          {typeof question.ord === "number"
            ? t("questionTitleOrd", { ord: question.ord })
            : t("questionTitleId", { id: question.id })}
        </h2>

        <p>{question.text}</p>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {(question.options ?? []).map((opt) => {
            const checked = selectedOptionId === opt.id;
            return (
              <label
                key={opt.id}
                style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={checked}
                  onChange={() => selectOption(question.id, opt.id)}
                  disabled={isBusy}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>

        {!(question.options?.length) && <p style={{ opacity: 0.8 }}>{t("noOptions")}</p>}
      </div>

      {!selectedOptionId && <p style={{ marginTop: 12, opacity: 0.8 }}>{t("selectToContinue")}</p>}

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button onClick={goPrev} disabled={!canPrev || isBusy}>
          {t("back")}
        </button>

        <button onClick={onNext} disabled={nextDisabled}>
          {t("next")}
        </button>

        <button onClick={onSubmit} disabled={submitDisabled}>
          {t("submit")}
        </button>
      </div>
    </div>
  );
}
