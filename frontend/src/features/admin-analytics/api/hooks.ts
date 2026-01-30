'use client';

import useSWR from 'swr';
import type {
  QuizAnalyticsDetailedDto,
  QuizAnalyticsOverviewDto,
} from '../model/types';

const fetcher = async (url: string, locale?: string) => {
  const headers: Record<string, string> = {};
  if (locale) {
    headers['x-locale'] = locale;
  }
  const res = await fetch(url, { credentials: 'include', headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export function useOverview(
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
      ? `/api/admin/quizzes/${quizId}/analytics/overview?${qs.toString()}`
      : null;

  return useSWR<QuizAnalyticsOverviewDto>(key, (url: string) => fetcher(url));
}

export function useDetailed(quizId: string, quizVersionId: string) {
  const qs = new URLSearchParams({ quizVersionId });

  const key =
    quizId && quizVersionId
      ? `/api/admin/quizzes/${quizId}/analytics/detailed?${qs.toString()}`
      : null;

  return useSWR<QuizAnalyticsDetailedDto>(key, (url: string) => fetcher(url));
}
