'use client';

import type { Question } from '../model/types';
import { answerWidgetByType } from './answer-widgets/registry';

export function QuestionCard({
  question,
  selectedOptionId,
  selectedOptionIds,
  onSelect,
  disabled,
}: {
  question: Question;
  selectedOptionId?: number;
  selectedOptionIds?: number[];
  onSelect: (questionId: number, optionId: number) => void;
  disabled?: boolean;
}) {
  const AnswerWidget = answerWidgetByType[question.qtype];

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 dark:border-slate-800/70 dark:bg-slate-950 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
        {question.text}
      </h1>

      <AnswerWidget
        question={question}
        selectedOptionId={selectedOptionId}
        selectedOptionIds={selectedOptionIds}
        onSelect={onSelect}
        disabled={disabled}
      />
    </div>
  );
}
