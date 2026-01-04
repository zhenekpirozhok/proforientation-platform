'use client';

import { Button } from 'antd';

const ACTION_WIDTH = 'sm:w-[220px]';

export function QuizPlayerActions({
  backLabel,
  nextLabel,
  submitLabel,
  onBack,
  onNext,
  onSubmit,
  backDisabled,
  nextDisabled,
  submitDisabled,
  isLast,
}: {
  backLabel: string;
  nextLabel: string;
  submitLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  backDisabled: boolean;
  nextDisabled: boolean;
  submitDisabled: boolean;
  isLast: boolean;
}) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button
        size="large"
        className={`w-full rounded-2xl ${ACTION_WIDTH}`}
        onClick={onBack}
        disabled={backDisabled}
      >
        ← {backLabel}
      </Button>

      <div className="flex w-full sm:w-auto">
        {!isLast ? (
          <Button
            type="primary"
            size="large"
            className={`w-full rounded-2xl ${ACTION_WIDTH}`}
            onClick={onNext}
            disabled={nextDisabled}
          >
            {nextLabel} →
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            className={`w-full rounded-2xl ${ACTION_WIDTH}`}
            onClick={onSubmit}
            disabled={submitDisabled}
          >
            {submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
