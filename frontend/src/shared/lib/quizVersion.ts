import type { QuizVersionDto } from '@/shared/api/generated/model';

export function pickLatestQuizVersion(versions?: QuizVersionDto[]) {
  if (!Array.isArray(versions) || versions.length === 0) return undefined;

  const withVersion = versions
    .map((v) => {
      const vRec = v as unknown as Record<string, unknown>;
      const n =
        typeof vRec.version === 'number' ? vRec.version : Number(vRec.version);
      return { v, n };
    })
    .filter((x) => Number.isFinite(x.n));

  if (withVersion.length > 0) {
    withVersion.sort((a, b) => b.n - a.n);
    return withVersion[0].v;
  }

  const withId = versions
    .map((v) => {
      const vRec = v as unknown as Record<string, unknown>;
      const n = typeof vRec.id === 'number' ? vRec.id : Number(vRec.id);
      return { v, n };
    })
    .filter((x) => Number.isFinite(x.n));

  if (withId.length > 0) {
    withId.sort((a, b) => b.n - a.n);
    return withId[0].v;
  }

  return versions[versions.length - 1];
}
