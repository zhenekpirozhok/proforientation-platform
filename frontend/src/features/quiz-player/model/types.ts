export type QuizPlayerStatus =
    | "idle"
    | "starting"
    | "in-progress"
    | "saving"
    | "submitting"
    | "finished"
    | "error";

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
};
