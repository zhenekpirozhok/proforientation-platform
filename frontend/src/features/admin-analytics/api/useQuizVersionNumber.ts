'use client';

import useSWR from 'swr';

type VersionRecord = { id?: number; version?: number };

const fetcher = async (url: string, locale?: string) => {
  const headers: Record<string, string> = {};
  if (locale) headers['x-locale'] = locale;

  const res = await fetch(url, { credentials: 'include', headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export function useQuizVersionNumber(
  locale: string,
  quizId: string,
  quizVersionId?: string,
) {
  const enabled = Boolean(quizId && quizVersionId);
  const url = enabled ? `/api/quizzes/${quizId}/versions` : null;

  const swr = useSWR<VersionRecord[] | null>(url, (u) => fetcher(u, locale), {
    revalidateOnFocus: false,
  });

  const versions = swr.data ?? [];
  const found = versions.find(
    (v) =>
      String(v.id) === String(quizVersionId) ||
      String(v.version) === String(quizVersionId),
  );

  return {
    data: found ? { version: found.version } : undefined,
    error: swr.error,
    isLoading: !swr.error && url != null && swr.data === undefined,
  };
}
