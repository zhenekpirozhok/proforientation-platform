export type QuizPlayerStatus =
  | 'idle'
  | 'starting'
  | 'in-progress'
  | 'submitting'
  | 'finished'
  | 'error';

export type AttemptResult = {
  traitScores: { traitCode: string; score: number }[];
  recommendations: {
    professionId: number;
    score: number;
    explanation?: string;
  }[];
};

export type QuizPlayerState = {
  quizId: number;
  quizVersionId: number | null;

  attemptId: number | null;
  guestToken: string | null;

  status: QuizPlayerStatus;
  error: string | null;

  currentIndex: number;
  totalQuestions: number | null;

  answersByQuestionId: Record<number, number>;
  result: AttemptResult | null;
};
