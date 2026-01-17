'use client';

import useSWR from 'swr';
import type {
  QuizAnalyticsDetailedDto,
  QuizAnalyticsOverviewDto,
} from '../model/types';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

function apiBase(locale: string) {
  const l = (locale || 'en').trim();
  return `/${l}/api`;
}

export function useOverview(
  locale: string,
  quizId: string,
  quizVersionId: string,
  from?: string,
  to?: string,
) {
  const qs = new URLSearchParams({ quizVersionId });
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);

  const key =
    quizId && quizVersionId
      ? `${apiBase(locale)}/admin/quizzes/${quizId}/analytics/overview?${qs.toString()}`
      : null;

  return useSWR<QuizAnalyticsOverviewDto>(key, fetcher);
}

export function useDetailed(
  locale: string,
  quizId: string,
  quizVersionId: string,
) {
  const qs = new URLSearchParams({ quizVersionId });

  const key =
    quizId && quizVersionId
      ? `${apiBase(locale)}/admin/quizzes/${quizId}/analytics/detailed?${qs.toString()}`
      : null;

  return useSWR<QuizAnalyticsDetailedDto>(key, fetcher);
}
