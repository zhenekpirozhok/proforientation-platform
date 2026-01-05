import { QuestionDtoQtype } from "@/shared/api/generated/model";

export type QuestionOption = {
  id: number;
  questionId: number;
  ord?: number;
  label: string;
  [k: string]: unknown;
};

export type Question = {
  id: number;
  quizVersionId: number;
  ord?: number;
  qtype: QuestionDtoQtype;
  text: string;
  options: QuestionOption[];
  [k: string]: unknown;
};

export type PageLike<T> = {
  content?: T[];
  totalElements?: number;
  last?: boolean;
  [k: string]: unknown;
};
