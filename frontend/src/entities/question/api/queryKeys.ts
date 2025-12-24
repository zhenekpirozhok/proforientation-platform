export const quizQuestionPageKey = (
  quizId: number,
  page: number,
  locale: string,
) => ['questions', 'quiz', quizId, { page, size: 1, locale }] as const;
