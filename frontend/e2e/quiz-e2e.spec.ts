import { test, expect } from '@playwright/test';

test('quiz flow: open details -> start -> answer all -> submit -> results', async ({ page }) => {
    const locale = process.env.E2E_LOCALE || 'en';
    const quizId = process.env.E2E_QUIZ_ID || '1';

    await page.goto(`/${locale}/quizzes/${quizId}`);

    await page.getByTestId('start-quiz-button').click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/quizzes/${quizId}/play`));

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
        await next.click();
    }

    await expect(page).toHaveURL(/\/results\/\d+$/);

    await expect(page.getByTestId('results-page')).toBeVisible();
});
