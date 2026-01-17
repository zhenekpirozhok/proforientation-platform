import type { QuizAnalyticsDetailedDto } from './types';

export type QuestionMetricsRow = {
  questionId: number;
  questionOrd: number;

  avgChoice?: number;
  answersCount?: number;

  discNorm?: number | null;
  discQuality?: string;
  attemptsSubmitted?: number;

  // distribution by optionOrd (not optionId)
  distribution: Array<{ optionOrd: number; count: number }>;
};

export function buildQuestionMetricsRows(
  d: QuizAnalyticsDetailedDto,
): QuestionMetricsRow[] {
  const byQ = new Map<number, QuestionMetricsRow>();

  const ensure = (questionId: number, questionOrd: number) => {
    const existing = byQ.get(questionId);
    if (existing) {
      // keep the smallest non-zero ord if we accidentally created with 0
      if (!existing.questionOrd && questionOrd)
        existing.questionOrd = questionOrd;
      return existing;
    }
    const row: QuestionMetricsRow = {
      questionId,
      questionOrd,
      distribution: [],
    };
    byQ.set(questionId, row);
    return row;
  };

  for (const a of d.avgChoicePerQuestion ?? []) {
    const row = ensure(a.questionId, a.questionOrd);
    row.avgChoice = a.avgChoice;
    row.answersCount = a.answersCount;
  }

  for (const od of d.optionDistribution ?? []) {
    const row = ensure(od.questionId, od.questionOrd);
    row.distribution.push({ optionOrd: od.optionOrd, count: od.count });
  }

  for (const dis of d.discrimination ?? []) {
    const existing = byQ.get(dis.questionId);
    const row = existing ?? ensure(dis.questionId, 0);
    row.discNorm = dis.discNorm;
    row.discQuality = dis.discQuality;
    row.attemptsSubmitted = dis.attemptsSubmitted;
  }

  for (const row of byQ.values()) {
    row.distribution.sort((a, b) => a.optionOrd - b.optionOrd);
  }

  return Array.from(byQ.values()).sort((a, b) => a.questionOrd - b.questionOrd);
}
