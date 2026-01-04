'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import type { AnswerWidgetProps } from './types';
import { SingleChoiceWidget } from './SingleChoiceWidget';

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

function likertCount(qtype: string) {
  return qtype === 'liker_scale_7' ? 7 : 5;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function LikertWidget({
  question,
  selectedOptionId,
  onSelect,
  disabled,
}: AnswerWidgetProps) {
  const count = likertCount(question.qtype || '');
  const opts = (question.options ?? []).slice(0, count);
  const n = opts.length;

  const selectedIdx = useMemo(
    () => opts.findIndex((o) => o.id === selectedOptionId),
    [opts, selectedOptionId],
  );

  const railRef = useRef<HTMLDivElement | null>(null);
  const scrollWrapRef = useRef<HTMLDivElement | null>(null);

  const [dragging, setDragging] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const progressPct =
    n > 1 && selectedIdx >= 0 ? (selectedIdx / (n - 1)) * 100 : 0;

  const selectByIdx = useCallback(
    (idx: number) => {
      const i = clamp(idx, 0, n - 1);
      const opt = opts[i];
      if (!opt) return;
      if (opt.id === selectedOptionId) return;
      onSelect(question.id, opt.id);
    },
    [n, opts, onSelect, question.id, selectedOptionId],
  );

  const idxFromClientX = useCallback(
    (clientX: number) => {
      const el = railRef.current;
      if (!el || n <= 1) return 0;

      const r = el.getBoundingClientRect();
      const inset = r.width / (2 * n);
      const left = r.left + inset;
      const right = r.right - inset;
      const x = clamp(clientX, left, right);
      const t = (x - left) / Math.max(1, right - left);
      return Math.round(t * (n - 1));
    },
    [n],
  );

  const measure = useCallback(() => {
    const el = scrollWrapRef.current;
    if (!el) return;
    const needsScroll = el.scrollWidth - el.clientWidth > 8;
    const isNarrow = window.matchMedia('(max-width: 640px)').matches;
    setUseFallback(isNarrow && needsScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const id = window.setTimeout(() => {
      measure();
    }, 0);

    const onResize = () => measure();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(id);
    };
  }, [measure, n]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      setDragging(true);
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      selectByIdx(idxFromClientX(e.clientX));
    },
    [disabled, idxFromClientX, selectByIdx],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging || disabled) return;
      selectByIdx(idxFromClientX(e.clientX));
    },
    [disabled, dragging, idxFromClientX, selectByIdx],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const current = selectedIdx >= 0 ? selectedIdx : 0;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        selectByIdx(current - 1);
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        selectByIdx(current + 1);
      }
      if (e.key === 'Home') {
        e.preventDefault();
        selectByIdx(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        selectByIdx(n - 1);
      }
    },
    [disabled, n, selectByIdx, selectedIdx],
  );

  if (useFallback) {
    return (
      <SingleChoiceWidget
        question={question}
        selectedOptionId={selectedOptionId}
        onSelect={onSelect}
        disabled={disabled}
      />
    );
  }

  const dotPx = count === 7 ? 44 : 48;
  const dotSizeClass =
    count === 7 ? 'h-11 w-11 sm:h-12 sm:w-12' : 'h-12 w-12 sm:h-14 sm:w-14';

  const railStyle: CSSVars = {
    ['--n']: n,
    ['--dotPx']: `${dotPx}px`,
    gridTemplateColumns: `repeat(${n}, minmax(var(--dotPx), 1fr))`,
  };

  return (
    <div className="mt-7">
      <div
        className={[
          'relative select-none',
          disabled ? '' : 'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
        ].join(' ')}
        role="radiogroup"
        tabIndex={0}
        aria-disabled={disabled}
        onKeyDown={onKeyDown}
      >
        <div
          ref={scrollWrapRef}
          className="overflow-x-auto overscroll-x-contain px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            ref={railRef}
            className="relative touch-pan-x"
            style={railStyle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              className="pointer-events-none absolute top-1/2 -translate-y-1/2"
              style={{
                left: `calc(var(--dotPx) / 2)`,
                right: `calc(var(--dotPx) / 2)`,
              }}
            >
              <div className="relative h-px bg-slate-200 dark:bg-slate-800">
                <motion.div
                  className="absolute left-0 top-0 h-px bg-indigo-500 dark:bg-indigo-400"
                  animate={{ width: `${progressPct}%` }}
                  transition={{
                    type: 'spring',
                    stiffness: 520,
                    damping: 45,
                    mass: 0.6,
                  }}
                />
              </div>
            </div>

            <div
              className="grid items-center gap-x-3"
              style={{
                gridTemplateColumns: `repeat(${n}, minmax(var(--dotPx), 1fr))`,
              }}
            >
              {opts.map((opt, idx) => {
                const checked = selectedOptionId === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(question.id, opt.id)}
                    className={[
                      'group flex min-w-0 items-center justify-center py-3',
                      'focus-visible:outline-none',
                      disabled ? 'opacity-60' : '',
                    ].join(' ')}
                    role="radio"
                    aria-checked={checked}
                    aria-label={`${idx + 1}. ${opt.label}`}
                    style={{ minWidth: dotPx }}
                  >
                    <span
                      className={[
                        'relative z-10 inline-flex shrink-0 items-center justify-center rounded-full border transition',
                        dotSizeClass,
                        checked
                          ? 'border-indigo-500 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-500'
                          : 'border-slate-300 bg-white group-hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:group-hover:border-slate-600',
                      ].join(' ')}
                      style={{ aspectRatio: '1 / 1' }}
                    >
                      <motion.span
                        className="rounded-full bg-white"
                        initial={false}
                        animate={{
                          width: checked ? 12 : 0,
                          height: checked ? 12 : 0,
                          opacity: checked ? 1 : 0,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 520,
                          damping: 35,
                          mass: 0.5,
                        }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="hidden grid gap-x-3 md:grid"
          style={{
            gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
          }}
        >
          {opts.map((opt) => (
            <div
              key={opt.id}
              className="min-w-0 px-1 text-center text-xs leading-snug text-slate-500 dark:text-slate-400"
            >
              {opt.label}
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-start justify-between gap-3 text-xs leading-snug text-slate-500 dark:text-slate-400 md:hidden">
          <span className="max-w-[45%] text-left">{opts[0]?.label ?? ''}</span>
          <span className="max-w-[45%] text-right">
            {opts[n - 1]?.label ?? ''}
          </span>
        </div>
      </div>
    </div>
  );
}
