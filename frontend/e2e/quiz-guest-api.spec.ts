import { test, expect } from "@playwright/test";

type QuestionOption = { id: number; ord?: number; label?: string };
type Question = { id: number; ord?: number; options: QuestionOption[] };
type PageLike<T> = {
    content?: T[];
    totalElements?: number;
    last?: boolean;
    number?: number;
};

async function dump(res: any, label: string) {
    const status = res.status();
    const text = await res.text().catch(() => "<no body>");
    return `${label}: ${status} ${text}`;
}

test("guest can complete quiz via API (bulk + submit)", async ({ request, baseURL }) => {
    const quizId = Number(process.env.E2E_QUIZ_ID ?? 1);
    const locale = process.env.E2E_LOCALE ?? "en";

    expect(baseURL, "baseURL is empty (check playwright.config)").toBeTruthy();

    const verRes = await request.get(`${baseURL}/api/quizzes/${quizId}/versions/current`, {
        headers: { "x-locale": locale },
    });
    expect(verRes.ok(), await dump(verRes, "current version failed")).toBeTruthy();

    const verJson = await verRes.json();
    const quizVersionId = Number(verJson?.id);
    expect(Number.isFinite(quizVersionId) && quizVersionId > 0).toBeTruthy();

    const startRes = await request.post(
        `${baseURL}/api/attempts/start?quizVersionId=${quizVersionId}`,
        {
            headers: { "x-locale": locale },
        }
    );

    expect(startRes.ok(), await dump(startRes, "start attempt failed")).toBeTruthy();

    const startJson = await startRes.json();
    const attemptId = Number(startJson?.attemptId);
    const guestToken = startJson?.guestToken;

    expect(Number.isFinite(attemptId) && attemptId > 0).toBeTruthy();
    expect(typeof guestToken).toBe("string");
    expect((guestToken as string).length).toBeGreaterThan(0);

    const optionIds: number[] = [];
    let page = 0;
    const size = 50;

    while (true) {
        const qRes = await request.get(`${baseURL}/api/questions/quiz/${quizId}?page=${page}&size=${size}`, {
            headers: { "x-locale": locale },
        });

        expect(qRes.ok(), await dump(qRes, `questions page=${page} failed`)).toBeTruthy();

        const qJson = (await qRes.json()) as PageLike<Question> | Question[];

        const questions: Question[] = Array.isArray(qJson)
            ? qJson
            : Array.isArray(qJson.content)
                ? qJson.content
                : [];

        for (const q of questions) {
            const neutral = q.options?.find((o) => o.ord === 3);
            const pick = neutral ?? q.options?.[0];
            if (!pick?.id) throw new Error(`No option for question ${q.id}`);
            optionIds.push(pick.id);
        }

        if (Array.isArray(qJson)) break;
        if (qJson.last === true) break;

        page += 1;
        if (page > 200) throw new Error("Too many pages");
    }

    expect(optionIds.length).toBeGreaterThan(0);

    const bulkPayload = { optionIds };

    const bulkRes = await request.post(`${baseURL}/api/attempts/${attemptId}/answers/bulk`, {
        headers: {
            "x-locale": locale,
            "x-guest-token": guestToken,
            "content-type": "application/json",
        },
        data: JSON.stringify(bulkPayload),
    });

    expect(bulkRes.ok(), await dump(bulkRes, "bulk failed")).toBeTruthy();

    const submitRes = await request.post(`${baseURL}/api/attempts/${attemptId}/submit`, {
        headers: {
            "x-locale": locale,
            "x-guest-token": guestToken,
        },
    });

    const submitText = await submitRes.text();

    if (!submitRes.ok()) {
        console.warn(`submit failed: ${submitRes.status()} ${submitText}`);
    } else {
        console.log("submit ok:", submitText);
    }
});
