import { test, expect } from '@playwright/test';

test('quiz flow: catalog -> details -> play -> submit -> results', async ({ page }) => {
    const locale = process.env.E2E_LOCALE || 'en';
    const quizId = process.env.E2E_QUIZ_ID;

    await page.goto(`/${locale}/quizzes`);

    const cards = page.getByTestId('quiz-card');
    await expect(cards.first()).toBeVisible();

    if (quizId) {
        await page.locator(`[data-testid="quiz-card"][data-quiz-id="${quizId}"]`).click();
    } else {
        await cards.first().click();
    }

    await expect(page).toHaveURL(new RegExp(`/${locale}/quizzes/\\d+$`));

    const startBtn = page.getByTestId('start-quiz-button');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/quizzes/\\d+/play$`));

    while (true) {
        const option = page.getByTestId('answer-option').first();
        await expect(option).toBeVisible();
        await option.click();

        const submit = page.getByTestId('submit-button');
        if (await submit.count()) {
            await submit.click();
            break;
        }

        const next = page.getByTestId('next-button');
        await expect(next).toBeEnabled();
        await next.click();
    }

    await expect(page).toHaveURL(/\/results\/\d+$/);
    await expect(page.getByTestId('results-page')).toBeVisible();
});
