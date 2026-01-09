import { test, expect } from '@playwright/test';

async function safeClick(locator: any, attempts = 12) {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
        try {
            await locator.waitFor({ state: 'visible', timeout: 15000 });
            await locator.scrollIntoViewIfNeeded();
            await locator.click({ timeout: 15000 });
            return;
        } catch (e) {
            lastErr = e;
            try {
                await locator.page().waitForTimeout(150 + i * 75);
            } catch { }
        }
    }
    throw lastErr;
}

async function safeClickViaEvaluate(locator: any) {
    await locator.waitFor({ state: 'visible', timeout: 15000 });
    await locator.scrollIntoViewIfNeeded();
    await locator.evaluate((el: any) => el.click());
}

test('quiz flow: catalog -> details -> play -> submit -> results', async ({ page, baseURL }) => {
    test.setTimeout(120_000);

    const locale = process.env.E2E_LOCALE || 'en';
    const quizId = process.env.E2E_QUIZ_ID;

    const base = baseURL ?? 'http://localhost:3000';
    const startUrl = `${base}/${locale}/quizzes`;

    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');

    const cards = page.getByTestId('quiz-card');
    await expect(cards.first()).toBeVisible({ timeout: 30000 });

    if (quizId) {
        const target = page.locator(
            `[data-testid="quiz-card"][data-quiz-id="${quizId}"]`,
        );
        if ((await target.count()) > 0) {
            await safeClick(target.first());
        } else {
            await safeClick(cards.first());
        }
    } else {
        await safeClick(cards.first());
    }

    await expect(page).toHaveURL(new RegExp(`/${locale}/quizzes/\\d+$`), {
        timeout: 30000,
    });

    const startBtn = page.getByTestId('start-quiz-button');
    await expect(startBtn).toBeVisible({ timeout: 30000 });
    await safeClick(startBtn);

    await expect(page).toHaveURL(new RegExp(`/${locale}/quizzes/\\d+/play$`), {
        timeout: 30000,
    });

    for (let step = 0; step < 500; step++) {
        const options = page.getByTestId('answer-option');
        await expect(options.first()).toBeVisible({ timeout: 30000 });

        const option = options.nth(0);
        try {
            await safeClick(option);
        } catch {
            await safeClickViaEvaluate(option);
        }

        const submit = page.getByTestId('submit-button');
        if (await submit.isVisible().catch(() => false)) {
            await safeClick(submit);

            await Promise.race([
                page.waitForURL(/\/results\/\d+$/, { timeout: 60000 }),
                page.getByTestId('results-page').waitFor({ state: 'visible', timeout: 60000 }),
            ]);

            await expect(page.getByTestId('results-page')).toBeVisible({ timeout: 60000 });
            return;
        }

        const next = page.getByTestId('next-button');
        await expect(next).toBeVisible({ timeout: 30000 });
        await expect(next).toBeEnabled({ timeout: 30000 });
        await safeClick(next);
    }

    throw new Error('Quiz did not reach submit state');
});
