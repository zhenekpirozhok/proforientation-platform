import type { QuizVersionDto } from '@/shared/api/generated/model';

export function pickLatestQuizVersion(versions?: QuizVersionDto[]) {
    if (!Array.isArray(versions) || versions.length === 0) return undefined;

    const withVersion = versions
        .map((v) => ({ v, n: typeof (v as any).version === 'number' ? (v as any).version : Number((v as any).version) }))
        .filter((x) => Number.isFinite(x.n));

    if (withVersion.length > 0) {
        withVersion.sort((a, b) => b.n - a.n);
        return withVersion[0].v;
    }

    const withId = versions
        .map((v) => ({ v, n: typeof (v as any).id === 'number' ? (v as any).id : Number((v as any).id) }))
        .filter((x) => Number.isFinite(x.n));

    if (withId.length > 0) {
        withId.sort((a, b) => b.n - a.n);
        return withId[0].v;
    }

    return versions[versions.length - 1];
}
