import type { Question } from "../../model/types";

export type AnswerWidgetProps = {
    question: Question;
    selectedOptionId?: number;
    selectedOptionIds?: number[];
    onSelect: (questionId: number, optionId: number) => void;
    disabled?: boolean;
};
