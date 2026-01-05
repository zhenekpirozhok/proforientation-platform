'use client';

import { motion } from 'framer-motion';
import type { AnswerWidgetProps } from './types';

export function MultiChoiceWidget({
  question,
  selectedOptionIds,
  onSelect,
  disabled,
}: AnswerWidgetProps) {
  const set = new Set(selectedOptionIds ?? []);

  return (
    <div className="mt-6 space-y-3">
      {(question.options ?? []).map((opt) => {
        const checked = set.has(opt.id);

        return (
          <motion.button
          data-testid="answer-option"
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question.id, opt.id)}
            whileHover={disabled ? undefined : { y: -1 }}
            whileTap={disabled ? undefined : { scale: 0.99 }}
            transition={{ duration: 0.12 }}
            className={[
              'w-full rounded-xl border px-4 py-4 text-left transition',
              'flex items-start gap-4',
              checked
                ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900/40',
              disabled ? 'opacity-60' : '',
            ].join(' ')}
          >
            <span
              className={[
                'mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                checked
                  ? 'border-indigo-500 bg-indigo-500'
                  : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950',
              ].join(' ')}
            >
              <span
                className={
                  checked
                    ? 'h-2.5 w-2.5 bg-white'
                    : 'h-2.5 w-2.5 bg-transparent'
                }
              />
            </span>

            <span className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 sm:text-base">
              {opt.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
