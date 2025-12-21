export type StartAttemptResponse = {
    attemptId: number;
    guestToken: string;
};

export type AnswerPayload = {
    questionId: number;
    optionId?: number;
    value?: string | number | boolean;
};

export type AttemptResult = {
    attemptId?: number;
    [k: string]: unknown;
};
