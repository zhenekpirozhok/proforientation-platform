export type QuizAnalyticsOverviewDto = {
  quizId: number;
  quizVersionId: number;

  attemptsStarted: number;
  attemptsCompleted: number;

  completionRate: number; // 0..1 (but your sample shows 1)
  avgDurationSeconds: number; // number

  activityDaily: Array<{
    day: string; // "YYYY-MM-DD"
    started: number;
    completed: number;
    avgDurationSeconds: number;
  }>;

  topProfessions: Array<{
    professionId: number;
    professionTitle: string;
    top1Count: number;
  }>;
};

export type QuizAnalyticsDetailedDto = {
  quizId: number;
  quizVersionId: number;

  modeChoicePerQuestion: Array<{
    questionId: number;
    questionOrd: number;
    modeChoice: number;
    modeCount: number;
    answersCount: number;
  }>;

  optionDistribution: Array<{
    questionId: number;
    questionOrd: number;
    optionId: number;
    optionOrd: number;
    count: number;
  }>;

  discrimination: Array<{
    questionId: number;
    discNorm: number | null; // null in sample
    discQuality: string; // "low_sample"
    attemptsSubmitted: number;
  }>;
};
