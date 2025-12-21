export type QuizPlayerStatus =
    | "idle"
    | "starting"
    | "in-progress"
    | "submitting"
    | "finished"
    | "error";

export type QuizPlayerState = {
    quizId: number;
    attemptId: number | null;
    guestToken: string | null;
    status: QuizPlayerStatus;
    error: string | null;
};
