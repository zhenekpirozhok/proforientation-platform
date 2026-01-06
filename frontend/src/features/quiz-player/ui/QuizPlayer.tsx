'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@/shared/i18n/lib/navigation'
import { useTranslations } from 'next-intl'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'

import { useCurrentQuizVersionIdQuery } from '../model/useCurrentQuizVersionIdQuery'
import { useQuizPlayerStore } from '../model/store'

import type { Question, PageLike } from '@/entities/question/model/types'
import type { AttemptResult } from '@/features/quiz-player/model/types'
import { parseResponse } from '@/shared/api/parseResponse'

import { useStartAttempt, useAddAnswersBulk, useSubmit } from '@/shared/api/generated/api'

import { QuizPlayerLayout } from './components/QuizPlayerLayout'
import { QuizProgressHeader } from './components/QuizProgressHeader'
import { QuizPlayerActions } from './components/QuizPlayerActions'
import { QuizPlayerSkeleton } from './components/QuizPlayerSkeleton'
import { QuestionCard } from '@/entities/question/ui/QuestionCard'
import { AnimatedQuestion } from './components/AnimatedQuestion'

type Props = { quizId: number }

type StartAttemptAny = { attemptId: number; guestToken?: string }

function isStartAttemptAny(v: unknown): v is StartAttemptAny {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.attemptId === 'number' && Number.isFinite(o.attemptId)
}

function safeErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  return 'Unknown error'
}

const BATCH_SIZE = 10

function batchIndexFromQuestionIndex(questionIndex0: number) {
  return Math.floor(questionIndex0 / BATCH_SIZE)
}

function indexInBatch(questionIndex0: number) {
  return questionIndex0 % BATCH_SIZE
}

const quizQuestionBatchKey = (quizId: number, batch: number, locale: string) =>
  ['questions', 'quiz', quizId, 'batch', batch, 'size', BATCH_SIZE, 'locale', locale] as const

async function fetchQuestionBatch(params: {
  quizId: number
  batch: number
  locale: string
  signal?: AbortSignal
}) {
  const { quizId, batch, locale, signal } = params
  const safeBatch = Math.max(0, batch)

  const sp = new URLSearchParams({
    page: String(safeBatch + 1),
    size: String(BATCH_SIZE),
  })

  const res = await fetch(`/api/questions/quiz/${quizId}?${sp.toString()}`, {
    method: 'GET',
    headers: { 'x-locale': locale },
    signal,
  })

  const data = await parseResponse<PageLike<Question> | Question[]>(res)

  if (Array.isArray(data)) {
    return { questions: data, total: undefined as number | undefined, last: true }
  }

  return {
    questions: Array.isArray(data.content) ? data.content : [],
    total: typeof data.totalElements === 'number' ? data.totalElements : undefined,
    last: data.last === true,
  }
}

async function fetchAttemptResult(attemptId: number, guestToken?: string | null) {
  const res = await fetch(`/api/attempts/${attemptId}/result`, {
    method: 'GET',
    headers: {
      ...(guestToken ? { 'x-guest-token': guestToken } : {}),
    },
    cache: 'no-store',
  })

  return parseResponse<AttemptResult>(res)
}

export function QuizPlayer({ quizId }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const t = useTranslations('QuizPlayer')
  const { locale } = useParams<{ locale: string }>()

  const {
    attemptId,
    guestToken,
    status,
    error,
    currentIndex,
    totalQuestions,
    answersByQuestionId,
    quizVersionId,
    bulkSentAttemptId,
    resumeOrStart,
    setAttempt,
    setStatus,
    setError,
    setTotalQuestions,
    goNext,
    goPrev,
    selectOption,
    setResult,
    setBulkSent,
  } = useQuizPlayerStore()

  const versionQuery = useCurrentQuizVersionIdQuery(quizId)

  const startAttempt = useStartAttempt({ mutation: { retry: false } })

  const addAnswersBulk = useAddAnswersBulk({
    mutation: { retry: false },
    request: {
      headers: {
        ...(guestToken ? { 'x-guest-token': guestToken } : {}),
      },
    },
  })

  const submitAttempt = useSubmit({
    mutation: { retry: false },
    request: {
      headers: {
        ...(guestToken ? { 'x-guest-token': guestToken } : {}),
      },
    },
  })

  const startedForVersionRef = useRef<number | null>(null)

  useEffect(() => {
    const vId = versionQuery.data
    if (!vId) return

    resumeOrStart(quizId, vId)

    const s = useQuizPlayerStore.getState()
    if (s.attemptId && s.guestToken) return

    if (startedForVersionRef.current === vId) return
    startedForVersionRef.current = vId

    let cancelled = false

    ;(async () => {
      try {
        const started = await startAttempt.mutateAsync({ params: { quizVersionId: vId } })
        if (cancelled) return

        if (!isStartAttemptAny(started)) throw new Error('Invalid start attempt response')

        const tok = typeof (started as any).guestToken === 'string' ? String((started as any).guestToken) : ''
        if (!tok) throw new Error('Missing guest token')

        setAttempt((started as any).attemptId, tok)
      } catch (e) {
        if (cancelled) return
        startedForVersionRef.current = null
        setError(safeErrorMessage(e))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [quizId, resumeOrStart, setAttempt, setError, startAttempt, versionQuery.data])

  const ready = Boolean(attemptId && guestToken && quizVersionId && locale)

  const safeIndex = Math.max(0, currentIndex)
  const batch = Math.max(0, batchIndexFromQuestionIndex(safeIndex))

  const batchQuery = useQuery({
    queryKey: quizQuestionBatchKey(quizId, batch, locale),
    enabled: ready && Number.isFinite(quizId) && quizId > 0,
    queryFn: ({ signal }) => fetchQuestionBatch({ quizId, batch, locale, signal }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const total = batchQuery.data?.total
    if (typeof total === 'number') setTotalQuestions(total)
  }, [batchQuery.data?.total, setTotalQuestions])

  const question: Question | null = useMemo(() => {
    const qs = batchQuery.data?.questions ?? []
    return qs[indexInBatch(safeIndex)] ?? null
  }, [batchQuery.data?.questions, safeIndex])

  const selectedOptionId = useMemo(() => {
    if (!question?.id) return undefined
    return answersByQuestionId[question.id]
  }, [answersByQuestionId, question?.id])

  const hasTotal = totalQuestions != null
  const isLast = hasTotal ? safeIndex === (totalQuestions ?? 1) - 1 : false

  const canNext = !hasTotal || !isLast
  const canSubmit = hasTotal && isLast

  const isBusy = status === 'submitting' || status === 'finished'

  useEffect(() => {
    if (!ready || !question) return

    const nextIndex = safeIndex + 1
    if (hasTotal && totalQuestions != null && nextIndex >= totalQuestions) return

    const nextBatch = Math.max(0, batchIndexFromQuestionIndex(nextIndex))
    if (nextBatch === batch) return

    const key = quizQuestionBatchKey(quizId, nextBatch, locale)
    if (qc.getQueryData(key)) return

    qc.prefetchQuery({
      queryKey: key,
      queryFn: ({ signal }) => fetchQuestionBatch({ quizId, batch: nextBatch, locale, signal }),
      staleTime: 30_000,
    }).catch(() => {})
  }, [ready, question, safeIndex, batch, hasTotal, totalQuestions, quizId, locale, qc])

  async function onNext() {
    if (isBusy) return
    if (!question || !selectedOptionId) return
    goNext()
  }

  async function onSubmit() {
    if (isBusy) return
    if (!attemptId || !guestToken || !hasTotal) return
    if (!question || !selectedOptionId) return

    try {
      const s = useQuizPlayerStore.getState()
      const optionIdsRaw = Object.values(s.answersByQuestionId)
      const optionIds = Array.from(new Set(optionIdsRaw))

      if (optionIds.length !== s.totalQuestions) {
        throw new Error(`Need exactly ${s.totalQuestions} distinct answers, got ${optionIds.length}`)
      }

      setStatus('submitting')

      if (bulkSentAttemptId !== attemptId) {
        await addAnswersBulk.mutateAsync({ attemptId, data: { optionIds } })
        setBulkSent(attemptId)
      }

      const result = await submitAttempt.mutateAsync({ attemptId })
      setResult(result as AttemptResult)

      setStatus('finished')
      router.push(`/results/${attemptId}`)
    } catch (e) {
      const message = safeErrorMessage(e)

      if (message.includes('Attempt already submitted')) {
        try {
          const r = await fetchAttemptResult(attemptId, guestToken)
          setResult(r as AttemptResult)
          setStatus('finished')
          router.push(`/results/${attemptId}`)
          return
        } catch (e2) {
          setStatus('in-progress')
          setError(safeErrorMessage(e2))
          return
        }
      }

      setStatus('in-progress')
      setError(message)
    }
  }

  if (versionQuery.isError) {
    return (
      <QuizPlayerLayout>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('errorVersion', { message: versionQuery.error?.message ?? '' })}
        </p>
      </QuizPlayerLayout>
    )
  }

  if (status === 'error') {
    return (
      <QuizPlayerLayout>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('errorGeneric', { message: error ?? '' })}
        </p>
      </QuizPlayerLayout>
    )
  }

  if (versionQuery.isLoading || !ready) {
    return (
      <QuizPlayerLayout>
        <QuizPlayerSkeleton />
      </QuizPlayerLayout>
    )
  }

  const isAbort = batchQuery.error instanceof DOMException && batchQuery.error.name === 'AbortError'

  if (batchQuery.isError && !isAbort) {
    return (
      <QuizPlayerLayout>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('errorQuestion', { message: safeErrorMessage(batchQuery.error) })}
        </p>
      </QuizPlayerLayout>
    )
  }

  if (!question) {
    return (
      <QuizPlayerLayout>
        <QuizPlayerSkeleton />
      </QuizPlayerLayout>
    )
  }

  const currentHuman = safeIndex + 1
  const total = totalQuestions ?? null

  const submitDisabled =
    !canSubmit ||
    !selectedOptionId ||
    addAnswersBulk.isPending ||
    submitAttempt.isPending ||
    isBusy

  return (
    <QuizPlayerLayout>
      <QuizProgressHeader current={currentHuman} total={total} />

      <AnimatedQuestion motionKey={question.id}>
        <QuestionCard question={question} selectedOptionId={selectedOptionId} onSelect={selectOption} disabled={isBusy} />
      </AnimatedQuestion>

      <QuizPlayerActions
        backLabel={t('back')}
        nextLabel={t('next')}
        submitLabel={t('submit')}
        onBack={() => {
          if (safeIndex <= 0 || isBusy) return
          goPrev()
        }}
        onNext={onNext}
        onSubmit={onSubmit}
        backDisabled={safeIndex <= 0 || isBusy}
        nextDisabled={!canNext || !selectedOptionId || isBusy}
        submitDisabled={submitDisabled}
        isLast={isLast}
      />
    </QuizPlayerLayout>
  )
}
