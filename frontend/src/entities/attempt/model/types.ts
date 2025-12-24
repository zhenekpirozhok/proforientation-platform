export type StartAttemptResponse = {
  attemptId: number;
  guestToken: string;
};

export type AnswerPayload = {
  optionId: number;
};

export type AttemptResult = {
  attemptId?: number;
  [k: string]: unknown;
};
