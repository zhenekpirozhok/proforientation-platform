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

export type AttemptViewTrait = {
  code: string;
  name: string;
  description?: string;
  score01: number;
};

export type AttemptViewProfession = {
  id: number;
  title: string;
  description?: string;
  score01: number;
};

export type AttemptViewDto = {
  attemptId: number;
  traits: AttemptViewTrait[];
  professions: AttemptViewProfession[];
};
